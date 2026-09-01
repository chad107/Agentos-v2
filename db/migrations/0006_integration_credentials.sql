-- AgentOS production schema — 0006: integration_credentials
--
-- Design notes (full narrative in INTEGRATION_SECURITY.md "OAuth /
-- token-storage architecture"): this is the "dedicated
-- integration_credentials table" design INTEGRATION_SECURITY.md names as
-- one of two acceptable options — written and tested against a real
-- Postgres 16 instance in this phase, with the encryption mechanism itself
-- left abstract on purpose (Phase 3A instruction: "leave actual
-- secret-provider implementation abstract"; which KMS/secrets-manager
-- provider is an explicit Owner Decision, PRODUCTION_READINESS_CHECKLIST.md
-- Lane 4 — not decidable in the abstract, and not decided here).
--
-- What this table intentionally does NOT do:
--   * It never stores a plaintext token. `token_ciphertext` is opaque BYTEA
--     produced by whatever KMS-backed encryption the application layer
--     eventually implements; this migration has no dependency on, and no
--     knowledge of, which KMS is chosen.
--   * It carries no read/write logic of its own — no adapter in
--     src/integrations/mock-adapters.ts writes to this table today (all
--     adapters remain mocked, no live credentials exist to store).
--   * It does not replace integration_settings (0003_business_entities.sql),
--     which stays status/metadata-only by design — this table is additive.

CREATE TABLE integration_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id      TEXT NOT NULL,           -- matches integration_settings.integration_id; not FK-constrained (a credential may be stored during onboarding before a settings row exists)
  token_type          TEXT NOT NULL CHECK (token_type IN ('oauth2_access', 'oauth2_refresh', 'api_key')),
  -- Ciphertext only, never plaintext. Encrypted/decrypted by the
  -- application layer using a key identified by encryption_key_id — this
  -- column and this migration never hold or handle the decryption key
  -- itself (see notes above).
  token_ciphertext    BYTEA NOT NULL,
  encryption_key_id   TEXT NOT NULL,           -- opaque KMS key identifier/ARN — a reference, never the key material
  scopes              TEXT[] NOT NULL DEFAULT '{}',
  expires_at          TIMESTAMPTZ NULL,
  last_rotated_at     TIMESTAMPTZ NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, integration_id, token_type)
);
CREATE INDEX idx_integration_credentials_tenant ON integration_credentials (tenant_id);

-- Row-Level Security, same pattern as every other tenant-scoped table
-- (DATABASE_DESIGN.md "Row-Level Security") — a licensee's stored
-- credential must never be reachable using another tenant's context.
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_credentials_isolated ON integration_credentials
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 0005_force_rls.sql already ran (it dynamically forces RLS on every
-- RLS-enabled table that exists *at the time it runs*), so a table added
-- afterward needs its own explicit FORCE — otherwise this table alone
-- would silently be missing the owner-bypass defense-in-depth 0005 gives
-- every earlier table.
ALTER TABLE integration_credentials FORCE ROW LEVEL SECURITY;
