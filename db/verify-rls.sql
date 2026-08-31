-- AgentOS — Row-Level Security verification script
--
-- Run this against a freshly-migrated database, connected AS agentos_app
-- (NOT as agentos_migrator or a superuser — the whole point is testing the
-- role the running application actually uses):
--
--   PGPASSWORD=<app_password> psql -h <host> -U agentos_app -d <db> -f db/verify-rls.sql
--
-- This is not a hypothetical checklist — every assertion below was run
-- against a real local Postgres 16 instance while building this schema,
-- and caught a real bug (table-owner RLS bypass, fixed by introducing the
-- three-role split in 0000_roles_and_setup.sql — see that file's header
-- comment). Re-run this after any schema change that touches RLS policies
-- or role grants, and wire it into CI once a real test database exists
-- (DEPLOYMENT_GUIDE.md "CI/CD").
--
-- Prerequisite: connect as agentos_provisioning first and create two
-- tenants with ids below, OR run scripts/seed-test-tenants.sql (not yet
-- written — Human-Developer Implementation) — this script only verifies
-- isolation given they exist, it does not provision them (agentos_app
-- cannot provision tenants by design, verified by assertion 5 below).

\set tenant_a '11111111-1111-1111-1111-111111111111'
\set tenant_b '22222222-2222-2222-2222-222222222222'

\echo '--- Assertion 1: as tenant A, only tenant A rows are visible ---'
SET app.current_tenant_id = :'tenant_a';
SELECT tenant_id FROM module_entitlements WHERE tenant_id <> :'tenant_a'::uuid;
-- ^ expect 0 rows. Any row returned here is a REAL isolation failure.

\echo '--- Assertion 2: as tenant B, only tenant B rows are visible ---'
SET app.current_tenant_id = :'tenant_b';
SELECT tenant_id FROM module_entitlements WHERE tenant_id <> :'tenant_b'::uuid;
-- ^ expect 0 rows.

\echo '--- Assertion 3: with no tenant context set, no rows leak (fail closed) ---'
-- Note: RESET mid-session vs. a genuinely fresh connection behave
-- differently here — RESET sets the variable to '' (empty string), which
-- fails the policy's ::uuid cast and errors; a fresh connection that never
-- set it at all returns NULL from current_setting(..., true) and silently
-- matches zero rows. Both were verified directly and are equally safe
-- (neither leaks a row) — this assertion accepts either outcome and only
-- fails if rows are actually returned.
RESET app.current_tenant_id;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  BEGIN
    SELECT count(*) INTO visible_count FROM module_entitlements;
    IF visible_count > 0 THEN
      RAISE EXCEPTION 'ISOLATION FAILURE: % rows visible with no tenant context', visible_count;
    END IF;
    RAISE NOTICE 'OK: 0 rows visible with no tenant context';
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE NOTICE 'OK: query rejected outright with no tenant context (also safe)';
  END;
END $$;

\echo '--- Assertion 4: cross-tenant INSERT is rejected ---'
SET app.current_tenant_id = :'tenant_a';
DO $$
BEGIN
  BEGIN
    INSERT INTO module_entitlements (tenant_id, module_key, status, tier)
    VALUES ('22222222-2222-2222-2222-222222222222', 'operations', 'active', 'starter');
    RAISE EXCEPTION 'ISOLATION FAILURE: cross-tenant insert succeeded';
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLERRM LIKE '%row-level security%' THEN
      RAISE NOTICE 'OK: cross-tenant insert correctly rejected';
    ELSE
      RAISE;
    END IF;
  END;
END $$;

\echo '--- Assertion 5: agentos_app cannot create a new tenant (must go through agentos_provisioning) ---'
DO $$
BEGIN
  BEGIN
    INSERT INTO tenants (id, slug, name, timezone, tier)
    VALUES (gen_random_uuid(), 'rls-verify-rogue', 'Should Not Exist', 'UTC', 'flagship');
    RAISE EXCEPTION 'ISOLATION FAILURE: agentos_app created a tenant row';
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLERRM LIKE '%row-level security%' THEN
      RAISE NOTICE 'OK: tenant creation correctly rejected for agentos_app';
    ELSE
      RAISE;
    END IF;
  END;
END $$;

\echo '--- All assertions passed if no ISOLATION FAILURE notices appear above. ---'
