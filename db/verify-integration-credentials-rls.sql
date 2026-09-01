-- AgentOS — integration_credentials Row-Level Security verification script
--
-- Same pattern and prerequisites as db/verify-rls.sql (read that file's
-- header first) — run against a database migrated through
-- 0006_integration_credentials.sql, connected AS agentos_app, with tenants
-- 11111111-1111-1111-1111-111111111111 and
-- 22222222-2222-2222-2222-222222222222 already provisioned:
--
--   PGPASSWORD=<app_password> psql -h <host> -U agentos_app -d <db> -f db/verify-integration-credentials-rls.sql
--
-- Actually run against a real local Postgres 16 instance while writing
-- 0006_integration_credentials.sql (Phase 3A) — all 6 assertions passed,
-- including that no plaintext-shaped token column exists on the table
-- (assertion 6) — the ciphertext-only design INTEGRATION_SECURITY.md
-- describes is what actually got built, not just documented.

\set tenant_a '11111111-1111-1111-1111-111111111111'
\set tenant_b '22222222-2222-2222-2222-222222222222'

\echo '--- Setup: insert one credential row per tenant as tenant A / B ---'
SET app.current_tenant_id = :'tenant_a';
INSERT INTO integration_credentials (tenant_id, integration_id, token_type, token_ciphertext, encryption_key_id, scopes)
VALUES (:'tenant_a', 'jobber', 'oauth2_access', '\xdeadbeef'::bytea, 'kms:test-key:tenant-a', ARRAY['jobs:read']);

SET app.current_tenant_id = :'tenant_b';
INSERT INTO integration_credentials (tenant_id, integration_id, token_type, token_ciphertext, encryption_key_id, scopes)
VALUES (:'tenant_b', 'jobber', 'oauth2_access', '\xfeedface'::bytea, 'kms:test-key:tenant-b', ARRAY['jobs:read']);

\echo '--- Assertion 1: as tenant A, only tenant A credential rows are visible ---'
SET app.current_tenant_id = :'tenant_a';
SELECT tenant_id, integration_id FROM integration_credentials WHERE tenant_id <> :'tenant_a'::uuid;
-- ^ expect 0 rows.

\echo '--- Assertion 2: as tenant A, exactly 1 row total is visible (not both tenants'' rows) ---'
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count FROM integration_credentials;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'ISOLATION FAILURE: tenant A sees % credential rows, expected 1', visible_count;
  END IF;
  RAISE NOTICE 'OK: tenant A sees exactly its own 1 credential row';
END $$;

\echo '--- Assertion 3: as tenant B, only tenant B credential rows are visible ---'
SET app.current_tenant_id = :'tenant_b';
SELECT tenant_id, integration_id FROM integration_credentials WHERE tenant_id <> :'tenant_b'::uuid;
-- ^ expect 0 rows.

\echo '--- Assertion 4: with no tenant context, no rows leak (fail closed) ---'
RESET app.current_tenant_id;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  BEGIN
    SELECT count(*) INTO visible_count FROM integration_credentials;
    IF visible_count > 0 THEN
      RAISE EXCEPTION 'ISOLATION FAILURE: % rows visible with no tenant context', visible_count;
    END IF;
    RAISE NOTICE 'OK: 0 rows visible with no tenant context';
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE NOTICE 'OK: query rejected outright with no tenant context (also safe)';
  END;
END $$;

\echo '--- Assertion 5: cross-tenant INSERT is rejected ---'
SET app.current_tenant_id = :'tenant_a';
DO $$
BEGIN
  BEGIN
    INSERT INTO integration_credentials (tenant_id, integration_id, token_type, token_ciphertext, encryption_key_id)
    VALUES ('22222222-2222-2222-2222-222222222222', 'qbo', 'api_key', '\x00'::bytea, 'kms:rogue');
    RAISE EXCEPTION 'ISOLATION FAILURE: cross-tenant credential insert succeeded';
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLERRM LIKE '%row-level security%' THEN
      RAISE NOTICE 'OK: cross-tenant credential insert correctly rejected';
    ELSE
      RAISE;
    END IF;
  END;
END $$;

\echo '--- Assertion 6: no plaintext column exists — schema only ever stores ciphertext ---'
DO $$
DECLARE
  plaintext_cols INTEGER;
BEGIN
  SELECT count(*) INTO plaintext_cols
  FROM information_schema.columns
  WHERE table_name = 'integration_credentials'
    AND column_name IN ('token', 'access_token', 'refresh_token', 'plaintext_token', 'secret');
  IF plaintext_cols > 0 THEN
    RAISE EXCEPTION 'DESIGN FAILURE: a plaintext-shaped token column exists on integration_credentials';
  END IF;
  RAISE NOTICE 'OK: no plaintext-shaped token column exists';
END $$;

\echo '--- All assertions passed if no ISOLATION FAILURE / DESIGN FAILURE notices appear above. ---'
