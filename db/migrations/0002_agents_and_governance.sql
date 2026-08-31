-- AgentOS production schema — 0002: agents, agent registry (governance), workflows

-- ---------------------------------------------------------------------------
-- Agents (src/domain/entities.ts Agent). Per-tenant so each tenant's agent
-- roster/status is independent (matches "external customers license
-- divisions a la carte" — a tenant only has agents for divisions it's
-- entitled to).
-- ---------------------------------------------------------------------------
CREATE TABLE agents (
  id                    TEXT NOT NULL,               -- AgentId, e.g. "sales" — stable slug, not a UUID
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL,
  mission               TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN (
                          'idle', 'monitoring', 'running', 'blocked', 'needs_human', 'degraded', 'paused'
                        )),
  permission_profile_id TEXT NOT NULL,
  systems_read          TEXT[] NOT NULL DEFAULT '{}',
  systems_write         TEXT[] NOT NULL DEFAULT '{}',
  schedules             TEXT[] NOT NULL DEFAULT '{}',
  last_run_at           TIMESTAMPTZ NULL,
  current_task          TEXT NULL,
  recent_accuracy_note  TEXT NULL,
  PRIMARY KEY (tenant_id, id)
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agents_isolated ON agents USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE TABLE agent_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id       TEXT NOT NULL,
  trigger        TEXT NOT NULL,
  started_at     TIMESTAMPTZ NOT NULL,
  ended_at       TIMESTAMPTZ NULL,
  status         TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  input_refs     TEXT[] NOT NULL DEFAULT '{}',
  output_summary TEXT NOT NULL DEFAULT '',
  error          TEXT NULL,
  FOREIGN KEY (tenant_id, agent_id) REFERENCES agents (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_agent_runs_tenant_agent ON agent_runs (tenant_id, agent_id, started_at DESC);
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_runs_isolated ON agent_runs USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Agent registry entries (src/domain/governance.ts AgentRegistryEntry).
-- Today this is a hand-authored TypeScript config
-- (src/config/agent-registry.ts) shared across the single demo tenant.
-- Moved to a table here because per-tenant customization (a licensee
-- adjusting an agent's trust state, within limits the platform allows) is
-- a reasonable future SaaS feature — see PRODUCTION_ARCHITECTURE.md §10.
-- ---------------------------------------------------------------------------
CREATE TABLE agent_registry_entries (
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id              TEXT NOT NULL,
  division_key          TEXT NOT NULL,
  version               TEXT NOT NULL,
  risk_tier             SMALLINT NOT NULL CHECK (risk_tier BETWEEN 0 AND 4),
  trust_state           TEXT NOT NULL CHECK (trust_state IN ('shadow', 'supervised', 'guarded_auto', 'trusted_auto')),
  trust_rationale       TEXT NOT NULL,
  capabilities          TEXT[] NOT NULL DEFAULT '{}',
  subscribed_events     TEXT[] NOT NULL DEFAULT '{}',
  emitted_events        TEXT[] NOT NULL DEFAULT '{}',
  required_permissions  TEXT[] NOT NULL DEFAULT '{}',
  kpi_mappings          TEXT[] NOT NULL DEFAULT '{}',
  knowledge_scopes      TEXT[] NOT NULL DEFAULT '{}',
  escalation_target     TEXT NOT NULL,
  accountable_human_role TEXT NOT NULL,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, agent_id),
  FOREIGN KEY (tenant_id, agent_id) REFERENCES agents (tenant_id, id) ON DELETE CASCADE
);
ALTER TABLE agent_registry_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_registry_entries_isolated ON agent_registry_entries
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Workflow registry (src/domain/events.ts WorkflowDefinition/WorkflowVersion,
-- src/config/workflows.ts). Kept platform-wide (no tenant_id) for the 7
-- canonical definitions, with a per-tenant override table for future
-- tenant-specific workflow configuration (e.g. a different SLA workflow
-- variant per licensee) — see PRODUCTION_ARCHITECTURE.md §10.
-- ---------------------------------------------------------------------------
CREATE TABLE workflow_definitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL,
  trigger_type        TEXT NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'manual')),
  trigger_event_type  TEXT NULL,
  owner_division       TEXT NOT NULL,
  current_version     INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE workflow_versions (
  workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_summary  TEXT NOT NULL,
  PRIMARY KEY (workflow_id, version)
);

-- Per-tenant workflow enable/disable + config override (nullable columns =
-- "inherit the platform default").
CREATE TABLE tenant_workflow_overrides (
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id  UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  status       TEXT NULL CHECK (status IN ('active', 'inactive')),
  configuration JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (tenant_id, workflow_id)
);
ALTER TABLE tenant_workflow_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_workflow_overrides_isolated ON tenant_workflow_overrides
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
