-- AgentOS production schema — 0003: business entities
-- One table per src/domain/entities.ts interface (Agent/AgentRun already in
-- 0002). Every table is tenant-scoped with RLS. Text/id fields that are
-- "refs" into other tables (customerRef, jobberRef, etc.) are kept as TEXT
-- rather than foreign keys where the referenced thing is an external
-- system's id (Jobber, QBO) — see DATABASE_DESIGN.md "External references
-- vs. foreign keys".

CREATE TABLE source_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration   TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  canonical_ref TEXT NOT NULL,
  synced_at     TIMESTAMPTZ NOT NULL,
  source_url    TEXT NULL
);
CREATE INDEX idx_source_records_tenant ON source_records (tenant_id);
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY source_records_isolated ON source_records USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE findings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id      TEXT NOT NULL,
  finding_type  TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('urgent', 'high', 'normal', 'low')),
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  entity_refs   TEXT[] NOT NULL DEFAULT '{}',
  evidence_refs TEXT[] NOT NULL DEFAULT '{}',
  confidence    TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  detected_at   TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved')),
  FOREIGN KEY (tenant_id, agent_id) REFERENCES agents (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_findings_tenant_status ON findings (tenant_id, status);
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY findings_isolated ON findings USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE recommendations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cohen_rank         SMALLINT NULL,
  priority           TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  category           TEXT NOT NULL CHECK (category IN ('safety', 'financial', 'customer', 'operations', 'sales', 'admin')),
  title              TEXT NOT NULL,
  summary            TEXT NOT NULL,
  why_it_matters     TEXT NOT NULL,
  impact_type        TEXT NULL,
  impact_label       TEXT NULL,
  impact_value       TEXT NULL,
  confidence         TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  confidence_reason  TEXT NOT NULL,
  source_refs        TEXT[] NOT NULL DEFAULT '{}',
  decision_required  TEXT NOT NULL,
  due_at             TIMESTAMPTZ NULL,
  status             TEXT NOT NULL CHECK (status IN ('new', 'surfaced', 'acknowledged', 'action_pending', 'resolved', 'dismissed')),
  finding_ids        UUID[] NOT NULL DEFAULT '{}',
  linked_entity_type TEXT NULL CHECK (linked_entity_type IN ('job', 'lead', 'accounting_item', 'customer_case')),
  linked_entity_id   UUID NULL
);
CREATE INDEX idx_recommendations_tenant_status ON recommendations (tenant_id, status);
CREATE INDEX idx_recommendations_tenant_rank ON recommendations (tenant_id, cohen_rank) WHERE cohen_rank IS NOT NULL;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendations_isolated ON recommendations USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE action_proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recommendation_id   UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  action_type         TEXT NOT NULL,
  description         TEXT NOT NULL,
  initiator_agent_id  TEXT NOT NULL,                  -- AgentId or "cohen"
  target_ref          TEXT NOT NULL,
  payload             JSONB NOT NULL DEFAULT '{}',
  permission_class    TEXT NOT NULL CHECK (permission_class IN (
                        'read', 'analyze', 'draft', 'propose', 'execute_low_risk', 'execute_consequential', 'prohibited'
                      )),
  approver_role       TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN (
                        'pending', 'clarification_requested', 'approved', 'approved_simulation',
                        'executing', 'completed', 'rejected', 'failed', 'expired'
                      )),
  evidence_refs       TEXT[] NOT NULL DEFAULT '{}',
  confidence          TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  urgency             TEXT NOT NULL CHECK (urgency IN ('urgent', 'high', 'normal', 'low')),
  risk_if_delayed     TEXT NOT NULL,
  impact_type         TEXT NULL,
  impact_label        TEXT NULL,
  impact_value        TEXT NULL,
  editable            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NULL,
  category            TEXT NOT NULL CHECK (category IN ('safety', 'financial', 'customer', 'operations', 'sales', 'admin')),
  -- Tier-4 prohibited actions can never reach 'approved'/'approved_simulation'/'completed' —
  -- enforced in application code (src/approvals/engine.ts) today; this CHECK is defense in
  -- depth so a direct SQL write (e.g. a future admin tool bug) can't create one either.
  CONSTRAINT prohibited_never_approved CHECK (
    NOT (permission_class = 'prohibited' AND status IN ('approved', 'approved_simulation', 'executing', 'completed'))
  )
);
CREATE INDEX idx_action_proposals_tenant_status ON action_proposals (tenant_id, status);
CREATE INDEX idx_action_proposals_recommendation ON action_proposals (recommendation_id);
ALTER TABLE action_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY action_proposals_isolated ON action_proposals USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE approval_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  proposal_id     UUID NOT NULL REFERENCES action_proposals(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  decision        TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'clarification_requested', 'edited_and_approved')),
  reason          TEXT NULL,
  edited_payload  JSONB NULL,
  decided_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_decisions_tenant_proposal ON approval_decisions (tenant_id, proposal_id);
ALTER TABLE approval_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_decisions_isolated ON approval_decisions USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
-- approval_decisions is append-only at the application layer (src/audit/log.ts
-- convention) — enforced here too: revoke UPDATE/DELETE from the app role
-- (see DATABASE_DESIGN.md "Append-only enforcement").

CREATE TABLE notifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_id       UUID NOT NULL REFERENCES users(id),
  priority           TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  recommendation_id  UUID NULL REFERENCES recommendations(id) ON DELETE SET NULL,
  channel            TEXT NOT NULL CHECK (channel IN ('push', 'in_app', 'email')),
  status             TEXT NOT NULL CHECK (status IN ('queued', 'delivered', 'read')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at       TIMESTAMPTZ NULL
);
CREATE INDEX idx_notifications_tenant_recipient ON notifications (tenant_id, recipient_id, status);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_isolated ON notifications USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------
CREATE TABLE leads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source         TEXT NOT NULL,
  customer_ref   TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  service_type   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at   TIMESTAMPTZ NULL,
  sla_due_at     TIMESTAMPTZ NOT NULL,
  stage          TEXT NOT NULL CHECK (stage IN (
                   'new', 'contacted', 'assessment', 'quote_in_progress', 'quote_sent',
                   'follow_up', 'accepted', 'deposit_pending', 'scheduled', 'lost_closed'
                 )),
  owner_id       UUID NOT NULL REFERENCES users(id),
  owner_name     TEXT NOT NULL,
  latest_touch   TEXT NOT NULL,
  next_action    TEXT NOT NULL,
  score          TEXT NOT NULL CHECK (score IN ('hot', 'normal', 'stale', 'at_risk')),
  jobber_ref     TEXT NULL,
  quote_ref      TEXT NULL,
  quote_sent_at  TIMESTAMPTZ NULL,
  quote_value    NUMERIC(12,2) NULL
);
CREATE INDEX idx_leads_tenant_stage ON leads (tenant_id, stage);
CREATE INDEX idx_leads_tenant_sla ON leads (tenant_id, sla_due_at) WHERE responded_at IS NULL;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_isolated ON leads USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
CREATE TABLE jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  jobber_id            TEXT NOT NULL,
  customer_ref         TEXT NOT NULL,
  customer_name        TEXT NOT NULL,
  service_type         TEXT NOT NULL,
  community            TEXT NOT NULL,
  scheduled_start      TIMESTAMPTZ NOT NULL,
  crew_refs            TEXT[] NOT NULL DEFAULT '{}',
  stage                TEXT NOT NULL CHECK (stage IN (
                         'newly_approved', 'needs_review', 'material_check', 'shipment_pending',
                         'ready', 'in_progress', 'closeout_missing', 'complete'
                       )),
  readiness_status     TEXT NOT NULL CHECK (readiness_status IN (
                         'unknown', 'needs_review', 'blocked', 'at_risk', 'ready',
                         'in_progress', 'closeout_missing', 'complete'
                       )),
  readiness_score      SMALLINT NOT NULL DEFAULT 0,
  jobber_estimate_ref  TEXT NOT NULL,
  open_questions       TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_jobs_tenant_scheduled ON jobs (tenant_id, scheduled_start);
CREATE INDEX idx_jobs_tenant_readiness ON jobs (tenant_id, readiness_status);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_isolated ON jobs USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE job_requirements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('equipment', 'material', 'note', 'photo', 'model_number', 'jsa', 'closeout')),
  description   TEXT NOT NULL,
  required_by   TIMESTAMPTZ NULL,
  status        TEXT NOT NULL CHECK (status IN ('missing', 'pending', 'satisfied')),
  owner_ref     TEXT NOT NULL,
  evidence_ref  TEXT NULL
);
CREATE INDEX idx_job_requirements_tenant_job ON job_requirements (tenant_id, job_id);
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_requirements_isolated ON job_requirements USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE equipment_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id                    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_estimate_line_ref  TEXT NOT NULL,
  manufacturer              TEXT NOT NULL,
  model                     TEXT NOT NULL,
  quantity                  INTEGER NOT NULL CHECK (quantity > 0),
  status                    TEXT NOT NULL CHECK (status IN ('pending', 'ordered', 'shipped', 'delivered', 'confirmed', 'unconfirmed')),
  supplier                  TEXT NOT NULL,
  tracking_ref              TEXT NULL
);
CREATE INDEX idx_equipment_items_tenant_job ON equipment_items (tenant_id, job_id);
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipment_items_isolated ON equipment_items USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------
CREATE TABLE safety_requirements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id         UUID NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('daily_jsa', 'ladder_inspection')),
  assignee_ref   TEXT NOT NULL,
  assignee_name  TEXT NOT NULL,
  due_at         TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('missing', 'reminded', 'escalated', 'submitted')),
  evidence_ref   TEXT NULL,
  escalated_at   TIMESTAMPTZ NULL
);
CREATE INDEX idx_safety_requirements_tenant_due ON safety_requirements (tenant_id, due_at) WHERE status <> 'submitted';
ALTER TABLE safety_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY safety_requirements_isolated ON safety_requirements USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------
CREATE TABLE accounting_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL CHECK (type IN ('vendor_bill', 'customer_invoice', 'deposit', 'statement')),
  vendor_or_customer_ref  TEXT NOT NULL,
  vendor_or_customer_name TEXT NOT NULL,
  source_ref              TEXT NOT NULL,
  amount                  NUMERIC(12,2) NOT NULL,
  due_at                  TIMESTAMPTZ NULL,
  status                  TEXT NOT NULL CHECK (status IN (
                            'captured', 'prepared', 'awaiting_review', 'reconciled',
                            'overdue', 'expected', 'received', 'unmatched'
                          )),
  qbo_ref                 TEXT NULL,
  duplicate_risk          BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_accounting_items_tenant_status ON accounting_items (tenant_id, status);
CREATE INDEX idx_accounting_items_tenant_due ON accounting_items (tenant_id, due_at) WHERE type = 'vendor_bill';
ALTER TABLE accounting_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounting_items_isolated ON accounting_items USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
-- NOTE: no payment/bank-write columns exist anywhere in this schema, by
-- design — see PRODUCTION_ARCHITECTURE.md §9 "non-negotiable design
-- constraint" and 01_MASTER_SPEC.md "Never implement autonomous
-- bank/payment movement."

-- ---------------------------------------------------------------------------
-- Customer Experience
-- ---------------------------------------------------------------------------
CREATE TABLE customer_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_ref   TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  job_ref        UUID NULL REFERENCES jobs(id) ON DELETE SET NULL,
  category       TEXT NOT NULL CHECK (category IN (
                   'warranty', 'service_repair', 'existing_install_issue', 'general_question', 'escalated_complaint'
                 )),
  severity       TEXT NOT NULL CHECK (severity IN ('urgent', 'high', 'normal', 'low')),
  status         TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'awaiting_customer', 'needs_technician_review', 'resolved')),
  summary        TEXT NOT NULL,
  next_action_at TIMESTAMPTZ NULL,
  owner_ref      TEXT NOT NULL
);
CREATE INDEX idx_customer_cases_tenant_status ON customer_cases (tenant_id, status);
ALTER TABLE customer_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_cases_isolated ON customer_cases USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE voice_calls (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_call_id   TEXT NOT NULL,
  direction          TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  contact_ref        TEXT NOT NULL,
  contact_name       TEXT NOT NULL,
  started_at         TIMESTAMPTZ NOT NULL,
  outcome            TEXT NOT NULL CHECK (outcome IN (
                       'jobber_request_created', 'transferred', 'voicemail', 'no_action', 'review_needed'
                     )),
  urgency            TEXT NOT NULL CHECK (urgency IN ('urgent', 'high', 'normal', 'low')),
  consent_ref        TEXT NULL,
  jobber_request_ref TEXT NULL,
  transcript_ref     TEXT NULL,
  -- Outbound-consent guardrail (AT-16, tests/audit-and-guardrails.test.ts):
  -- an outbound call row without a consent_ref is a data-integrity bug, not
  -- just a UI concern — enforced here too.
  CONSTRAINT outbound_requires_consent CHECK (direction <> 'outbound' OR consent_ref IS NOT NULL)
);
CREATE INDEX idx_voice_calls_tenant_started ON voice_calls (tenant_id, started_at DESC);
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY voice_calls_isolated ON voice_calls USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Knowledge
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('note', 'extracted_rule', 'proposed_sop', 'approved_sop', 'superseded_sop')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  source_refs   TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'superseded')),
  version       INTEGER NOT NULL DEFAULT 1,
  approved_by   UUID NULL REFERENCES users(id),
  approved_at   TIMESTAMPTZ NULL,
  -- Milestone 8 scope layer (src/domain/memory.ts KnowledgeScopeType) — added
  -- here even though the current TS KnowledgeItem type doesn't carry it yet
  -- (BUILD_STATUS_V2.md "Not yet started"), since a real DB migration is the
  -- natural place to close that gap rather than adding it twice.
  scope_type    TEXT NOT NULL DEFAULT 'company' CHECK (scope_type IN ('global', 'company', 'division', 'executive')),
  scope_ref     TEXT NULL
);
CREATE INDEX idx_knowledge_items_tenant_status ON knowledge_items (tenant_id, status);
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_items_isolated ON knowledge_items USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Integrations (src/domain/entities.ts IntegrationSettings). Credentials
-- are NEVER stored in this table — see INTEGRATION_SECURITY.md for the
-- separate encrypted-secret-store design. This table is status/metadata
-- only, mirroring exactly what Settings > Integrations already displays.
-- ---------------------------------------------------------------------------
CREATE TABLE integration_settings (
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id      TEXT NOT NULL,
  label               TEXT NOT NULL,
  tier                TEXT NOT NULL,
  connected           BOOLEAN NOT NULL DEFAULT false,
  read_capabilities   TEXT[] NOT NULL DEFAULT '{}',
  write_capabilities  TEXT[] NOT NULL DEFAULT '{}',
  permission_scope    TEXT NOT NULL,
  last_sync_at        TIMESTAMPTZ NULL,
  health              TEXT NOT NULL CHECK (health IN ('ok', 'degraded', 'error', 'not_configured')),
  health_message      TEXT NOT NULL,
  PRIMARY KEY (tenant_id, integration_id)
);
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_settings_isolated ON integration_settings
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
