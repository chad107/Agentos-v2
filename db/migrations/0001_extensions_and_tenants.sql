-- AgentOS production schema — 0001: extensions, tenants, users, membership, entitlements
--
-- Design notes (full narrative in DATABASE_DESIGN.md):
--   * Every business table carries tenant_id and is indexed on it first.
--   * gen_random_uuid() (pgcrypto) is used for all primary keys — safe to
--     generate client-side or server-side, no coordination needed.
--   * Row-Level Security is enabled on every tenant-scoped table as
--     defense in depth behind the application-layer tenant checks in
--     src/lib/tenant-context.ts. The app connects as a role that has
--     app.current_tenant_id set per-request (see DATABASE_DESIGN.md
--     "Row-Level Security" section) — RLS policies below reference it.
--   * This file is written to run cleanly on a fresh Postgres 16 database.
--     It has been executed against a real local Postgres 16 instance as
--     part of writing this schema — not just hand-reviewed.

-- pgcrypto and citext are created by 0000_roles_and_setup.sql (as a real
-- superuser — agentos_migrator, which runs this file, deliberately lacks
-- the privilege to create extensions itself; verified).

-- ---------------------------------------------------------------------------
-- Tenants (src/domain/platform.ts Tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,               -- e.g. "vrhp" — stable, human-readable
  name          TEXT NOT NULL,
  timezone      TEXT NOT NULL,
  tier          TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise', 'flagship')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL                    -- soft delete; retention policy in DATABASE_DESIGN.md
);

-- ---------------------------------------------------------------------------
-- Users (src/domain/entities.ts User) — global identity, not per-tenant.
-- A person can belong to more than one tenant via tenant_memberships.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  CITEXT NOT NULL UNIQUE,     -- requires the citext extension; case-insensitive
  name                   TEXT NOT NULL,
  status                 TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'invited',
  notification_channels  TEXT[] NOT NULL DEFAULT '{}',
  bundle_non_urgent      BOOLEAN NOT NULL DEFAULT true,
  -- Real auth fields (AUTHORIZATION_MODEL.md): populated once a real auth
  -- provider is chosen. Nullable because provider choice is an Owner
  -- Decision not yet made — see PRODUCTION_ARCHITECTURE.md.
  auth_provider          TEXT NULL,                  -- e.g. 'password', 'google', 'microsoft'
  auth_subject           TEXT NULL,                  -- provider's stable user id
  password_hash          TEXT NULL,                  -- only if auth_provider = 'password'; argon2id, never plaintext
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tenant membership + role (AUTHORIZATION_MODEL.md)
-- src/domain/enums.ts USER_ROLES today is a single global role per demo
-- user; production needs the role scoped per tenant, since one person may
-- be an Owner at one licensed tenant and an Employee (or nothing) at
-- another.
-- ---------------------------------------------------------------------------
CREATE TABLE tenant_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN (
                'owner', 'admin', 'manager', 'employee',   -- internal roles
                'customer'                                  -- future customer-facing role, per phase brief
              )),
  status      TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'invited',
  invited_by  UUID NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_memberships_tenant ON tenant_memberships (tenant_id);
CREATE INDEX idx_tenant_memberships_user ON tenant_memberships (user_id);

-- ---------------------------------------------------------------------------
-- Module entitlements (src/domain/platform.ts ModuleEntitlement)
-- The licensing/paywall table — mirrors src/lib/tenant-context.ts exactly.
-- ---------------------------------------------------------------------------
CREATE TABLE module_entitlements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key      TEXT NOT NULL CHECK (module_key IN (
                    'sales', 'marketing', 'operations', 'finance', 'safety',
                    'customer_experience', 'administration', 'executive_intelligence'
                  )),
  status          TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'trial', 'suspended')),
  tier            TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise', 'flagship')),
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NULL,
  configuration   JSONB NOT NULL DEFAULT '{}',
  UNIQUE (tenant_id, module_key)
);
CREATE INDEX idx_module_entitlements_tenant ON module_entitlements (tenant_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security — enabled now, policies added per-table as each table
-- is created in the following migration files (each references
-- current_setting('app.current_tenant_id', true)::uuid, set once per
-- request by the application's DB connection middleware).
-- ---------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_entitlements ENABLE ROW LEVEL SECURITY;

-- tenants itself has no tenant_id column (it IS the tenant) — a user may
-- only see tenant rows they have a membership in.
CREATE POLICY tenant_select_own ON tenants
  FOR SELECT
  USING (id IN (
    SELECT tenant_id FROM tenant_memberships
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY tenant_memberships_isolated ON tenant_memberships
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY module_entitlements_isolated ON module_entitlements
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
