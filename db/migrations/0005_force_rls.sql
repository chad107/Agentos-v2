-- AgentOS production schema — 0005: FORCE ROW LEVEL SECURITY everywhere
--
-- Defense in depth for the exact bug documented in 0000_roles_and_setup.sql:
-- if a table's owner ever runs a query directly (an admin script, a future
-- migration tool, a developer debugging via a superuser-adjacent
-- connection), FORCE ROW LEVEL SECURITY makes the policy apply even to the
-- owner. It does not protect against an actual superuser or a role with
-- BYPASSRLS — nothing in Postgres can — so agentos_app must never be
-- granted either (see DATABASE_DESIGN.md "Row-Level Security").
--
-- Written as a DO block over pg_tables rather than one ALTER TABLE per
-- table, so a future migration that adds a tenant-scoped table without
-- updating this file doesn't silently ship without FORCE — this always
-- forces every table that already has row security enabled.

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
  LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;
