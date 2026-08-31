-- AgentOS production schema — 0004: audit trail, event log, decision memory, KPI history
--
-- audit_events is the single most important table in this schema from a
-- governance standpoint: 01_MASTER_SPEC.md requires every material
-- agent/human action to be audited, and src/audit/log.ts already enforces
-- "append-only, no update/delete" in application code. This migration
-- enforces it at the database grant level too (see the REVOKE statements
-- at the bottom), matching the comment already in src/audit/log.ts that
-- anticipated this.

CREATE TABLE audit_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_type     TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'cohen', 'system')),
  actor_id       TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}',
  correlation_id TEXT NOT NULL,
  summary        TEXT NOT NULL
);
CREATE INDEX idx_audit_events_tenant_time ON audit_events (tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_events_tenant_entity ON audit_events (tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_events_tenant_correlation ON audit_events (tenant_id, correlation_id);
CREATE INDEX idx_audit_events_tenant_type ON audit_events (tenant_id, event_type);
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_events_isolated ON audit_events USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Event bus log (src/domain/events.ts EventEnvelope, src/events/bus.ts).
-- Currently in-memory only. Durable storage is required before the
-- event->workflow dispatcher (src/events/dispatcher.ts) can be trusted in
-- production — an event silently lost on a crash means a workflow that
-- should have been routed, wasn't, with no record that it was ever missed.
-- ---------------------------------------------------------------------------
CREATE TABLE event_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  source          TEXT NOT NULL,
  subject_type    TEXT NOT NULL,
  subject_id      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  schema_version  SMALLINT NOT NULL DEFAULT 1,
  -- Idempotency: a webhook or retried publish should never create two rows
  -- for the same logical event. dedupe_key is populated by the publisher
  -- (e.g. a vendor's webhook delivery id, or `${type}:${subject_id}:${correlation_id}`
  -- for internally-generated events) — see INTEGRATION_SECURITY.md
  -- "Webhook idempotency".
  dedupe_key      TEXT NOT NULL,
  UNIQUE (tenant_id, dedupe_key)
);
CREATE INDEX idx_event_log_tenant_type_time ON event_log (tenant_id, type, occurred_at DESC);
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_log_isolated ON event_log USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Decision / outcome memory (src/domain/memory.ts, src/repositories/decisions.ts)
-- ---------------------------------------------------------------------------
CREATE TABLE decisions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  context                  TEXT NOT NULL,
  alternatives_considered  TEXT[] NOT NULL DEFAULT '{}',
  rationale                TEXT NOT NULL,
  approver_user_id         UUID NOT NULL REFERENCES users(id),
  linked_proposal_id       UUID NULL REFERENCES action_proposals(id) ON DELETE SET NULL,
  expected_outcome         TEXT NOT NULL,
  decided_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_decisions_tenant_time ON decisions (tenant_id, decided_at DESC);
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY decisions_isolated ON decisions USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE outcomes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  decision_id               UUID NOT NULL UNIQUE REFERENCES decisions(id) ON DELETE CASCADE,
  status                    TEXT NOT NULL CHECK (status IN ('pending_measurement', 'measured', 'not_measurable')),
  actual_outcome            TEXT NULL,
  measured_at               TIMESTAMPTZ NULL,
  lesson                    TEXT NULL,
  -- A lesson becomes a *proposed* knowledge update, reviewed like anything
  -- else — never an automatic edit to knowledge_items. This column stores
  -- the proposal text only; turning it into an actual knowledge_items row
  -- still goes through the normal approval-review flow.
  proposed_knowledge_update TEXT NULL
);
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY outcomes_isolated ON outcomes USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- KPI observation history (src/domain/platform.ts KPIObservation,
-- src/repositories/kpi-observations.ts). Recorded as-displayed strings
-- today (not normalized numbers) — see DATABASE_DESIGN.md "KPI history:
-- string vs. numeric" for why, and the migration path to a numeric
-- version once real forecasting is built.
-- ---------------------------------------------------------------------------
CREATE TABLE kpi_observations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_key  TEXT NOT NULL,
  kpi_label     TEXT NOT NULL,
  value         TEXT NOT NULL,
  observed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kpi_observations_tenant_division_time ON kpi_observations (tenant_id, division_key, kpi_label, observed_at DESC);
ALTER TABLE kpi_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_observations_isolated ON kpi_observations USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Append-only enforcement. Run once, as a superuser, after the application
-- role exists (see DEPLOYMENT_GUIDE.md for role provisioning). Commented
-- out here because the role doesn't exist yet in a fresh database — this
-- is the exact statement to run once it does.
-- ---------------------------------------------------------------------------
-- REVOKE UPDATE, DELETE ON audit_events FROM agentos_app;
-- REVOKE UPDATE, DELETE ON approval_decisions FROM agentos_app;
-- REVOKE UPDATE, DELETE ON event_log FROM agentos_app;
