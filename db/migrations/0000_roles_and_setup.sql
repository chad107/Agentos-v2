-- AgentOS production schema — 0000: roles (run this FIRST, as a superuser)
--
-- CRITICAL, verified-the-hard-way finding: PostgreSQL's Row-Level Security
-- does NOT apply to a table's owner, regardless of RLS being enabled —
-- only to other roles granted access. Running the migrations below as a
-- single "do everything" role that both owns the tables AND serves the
-- application's queries means every RLS policy in this schema is silently
-- bypassed. This is not theoretical: this exact mistake was made and
-- caught while building this schema — connecting as the table owner
-- returned every tenant's rows regardless of app.current_tenant_id, and
-- only creating a genuinely separate, non-owner application role fixed it
-- (reproduced in db/verify-rls.sql). Do not skip this file.
--
-- Three roles:
--   agentos_migrator    — owns all tables; the only role that runs files in
--                          this directory. Never used by the running app.
--   agentos_app          — the role ordinary request handling connects as.
--                          Granted DML, no DDL, not an owner — RLS applies.
--                          This role can never create a tenant (verified:
--                          tenants has no INSERT policy for it, by design —
--                          see below) or read across tenants.
--   agentos_provisioning — used ONLY by the tenant-onboarding flow
--                          (AUTHORIZATION_MODEL.md "Tenant provisioning"),
--                          never by regular per-request API handlers.
--                          Granted BYPASSRLS so it can create the very
--                          first row (a new tenant) that no tenant-scoped
--                          policy could otherwise admit. This is real
--                          privilege, not a workaround — restrict which
--                          part of the codebase is allowed to hold this
--                          connection string as tightly as a database
--                          admin credential, and audit every use of it
--                          (see SECURITY_ARCHITECTURE.md "Audit logging").
--
-- Usage (run once per fresh environment, as a real superuser):
--   psql -v migrator_password="'<random-generated>'" -v app_password="'<random-generated>'" \
--        -f 0000_roles_and_setup.sql
-- psql substitutes :'var' as a quoted SQL literal from a -v var=value flag.
-- Generate both passwords with a real secret generator and store them in
-- the environment's secret manager immediately — see DEPLOYMENT_GUIDE.md
-- "Provisioning a new environment". Never commit generated passwords.
--
-- Re-running this file against an environment where the roles already
-- exist will fail on CREATE ROLE with "already exists" — that's
-- intentional (idempotent role *rotation* is a deliberate separate
-- operation, not a side effect of re-running migrations; see
-- DEPLOYMENT_GUIDE.md "Rotating database credentials").

-- Extensions require superuser (or a managed-provider equivalent, e.g.
-- RDS's rds_superuser) — agentos_migrator intentionally does NOT have
-- superuser, so this must happen here, not in 0001. Verified: attempting
-- CREATE EXTENSION as agentos_migrator fails with "permission denied to
-- create extension" on a stock Postgres 16 install.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE ROLE agentos_migrator LOGIN PASSWORD :'migrator_password';
CREATE ROLE agentos_app LOGIN PASSWORD :'app_password';
CREATE ROLE agentos_provisioning LOGIN PASSWORD :'provisioning_password' BYPASSRLS;

ALTER SCHEMA public OWNER TO agentos_migrator;
GRANT USAGE ON SCHEMA public TO agentos_app;
GRANT USAGE ON SCHEMA public TO agentos_provisioning;

-- Applies to every table agentos_migrator creates from now on in this
-- schema, including all of 0001-0004 run after this file — both
-- agentos_app and agentos_provisioning get DML rights automatically as
-- each table is created, no separate GRANT step needed per table. RLS
-- (not GRANT) is what actually restricts agentos_app to its own tenant;
-- agentos_provisioning's BYPASSRLS is the intentional exception, scoped
-- by which code path is trusted with its credentials, not by GRANT.
ALTER DEFAULT PRIVILEGES FOR ROLE agentos_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agentos_app, agentos_provisioning;

-- Append-only tables (0004) additionally need UPDATE/DELETE revoked from
-- agentos_app specifically, once those tables exist — run after 0004:
--   REVOKE UPDATE, DELETE ON audit_events, approval_decisions, event_log FROM agentos_app;
