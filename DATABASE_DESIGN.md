# AgentOS — Production Database Design

Replaces the local SQLite stopgap (`src/data/persistence.ts`) with a real
PostgreSQL schema. **Status: schema designed and verified against a real
Postgres 16 instance in this session — not deployed.** No managed database
has been provisioned; that is an Owner Decision (see
`PRODUCTION_READINESS_CHECKLIST.md`). Swapping `src/data/store.ts`'s
internals to query this schema instead of the in-memory object is
Human-Developer Implementation.

## Why this document can say "verified," not just "designed"

Every migration file under `db/migrations/` was actually executed against
a real, local PostgreSQL 16 server during this work — not just written and
eyeballed. That process caught three real bugs before they could reach a
human developer's desk:

1. **Table-owner RLS bypass.** PostgreSQL's Row-Level Security does not
   apply to a table's owner by default, regardless of `ENABLE ROW LEVEL
   SECURITY`. The first version of this schema was created and queried as
   the same role, and every tenant-isolation test silently passed data
   across tenants — RLS was enabled but not actually restricting anything.
   Fixed by splitting into three roles (below) and adding `FORCE ROW LEVEL
   SECURITY` as defense in depth (`db/migrations/0000_roles_and_setup.sql`,
   `0005_force_rls.sql`).
2. **`CREATE EXTENSION` requires superuser.** The migration role
   (`agentos_migrator`) correctly does *not* have superuser — which means
   it also can't create the `pgcrypto`/`citext` extensions the schema
   needs. Fixed by moving extension creation into the one-time,
   superuser-run bootstrap file.
3. **Tenant provisioning has no natural home under strict RLS.** Once RLS
   correctly denies cross-tenant access, *creating the first row of a new
   tenant* has no tenant context to match against — a naive fix would be
   "add a permissive INSERT policy," which reopens the hole for everyone.
   Fixed with a third, narrowly-scoped `agentos_provisioning` role (see
   below) rather than weakening the policy.

`db/verify-rls.sql` reproduces the exact proof used to confirm the fix —
run it against any environment after a schema or role change.

## Roles (the core of the isolation model)

| Role | Used by | Privileges |
|---|---|---|
| `agentos_migrator` | CI/deploy migration step only | Owns all tables, runs DDL. Never used by the running application. |
| `agentos_app` | The running application (every regular request) | SELECT/INSERT/UPDATE/DELETE, subject to RLS on every tenant-scoped table. Cannot create a tenant. |
| `agentos_provisioning` | The tenant-onboarding flow only | `BYPASSRLS` — the one role that can insert the first row of a new tenant. Must never be used for regular request handling; treat its credentials like a database admin credential. |

**The database's connection string the deployed app uses must be
`agentos_app`'s, never `agentos_migrator`'s or a superuser's.** This is the
single most important operational rule this schema depends on — see
`DEPLOYMENT_GUIDE.md` "Database credentials."

## Row-Level Security

Every tenant-scoped table has:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;  -- applied globally by 0005, defense in depth
CREATE POLICY <table>_isolated ON <table>
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

The application must `SET app.current_tenant_id = '<uuid>'` once per
request/transaction, derived from the authenticated session's tenant
membership (`AUTHORIZATION_MODEL.md`) — **never from a client-supplied
value**. This is a defense-in-depth layer underneath the application-level
checks already in `src/lib/tenant-context.ts`; either layer failing alone
should not leak data, which is exactly what was proven in `db/verify-rls.sql`
(a missing or malformed tenant context fails closed — zero rows or an
error, never "all rows").

**Recommendation for the connection-pooling layer:** if using PgBouncer or
similar in transaction-pooling mode, `SET` must happen inside the same
transaction as the query (session-level `SET` doesn't survive across pooled
connections) — use `SET LOCAL` inside an explicit transaction, or a
connection-pool mode that preserves session state. This is a concrete
Human-Developer Implementation detail, not yet built.

## Schema overview

Four migration files (plus the `0000` role bootstrap and `0005` RLS-force
pass), applied in order:

| File | Contents |
|---|---|
| `0000_roles_and_setup.sql` | Extensions, the three roles, default privilege grants |
| `0001_extensions_and_tenants.sql` | `tenants`, `users`, `tenant_memberships`, `module_entitlements` |
| `0002_agents_and_governance.sql` | `agents`, `agent_runs`, `agent_registry_entries`, `workflow_definitions`, `workflow_versions`, `tenant_workflow_overrides` |
| `0003_business_entities.sql` | Every v1 domain entity: findings, recommendations, action proposals, approval decisions, notifications, leads, jobs + sub-entities, safety, accounting, customer cases, voice calls, knowledge items, integration settings |
| `0004_events_memory_audit.sql` | `audit_events`, `event_log`, `decisions`, `outcomes`, `kpi_observations` |
| `0005_force_rls.sql` | Applies `FORCE ROW LEVEL SECURITY` to every RLS-enabled table, dynamically (won't silently skip a future table) |
| `0006_integration_credentials.sql` | `integration_credentials` — the ciphertext-only token store `INTEGRATION_SECURITY.md` names as one of two acceptable designs, added and verified in Phase 3A (see below) |

Every table maps 1:1 to a `src/domain/*` TypeScript interface — see the
comment at the top of each migration file for the exact source type. This
was deliberate: no new fields were invented, and no existing field was
dropped, so the mapping from repository code to schema is direct.

### Notable schema decisions

- **UUID primary keys** (`gen_random_uuid()`) everywhere except `agents`,
  `agent_registry_entries`, and `integration_settings`, which use the
  existing stable string slugs (`AgentId`, `IntegrationId`) as part of a
  composite `(tenant_id, id)` primary key — matching how the TypeScript
  code already treats them as fixed enums, not arbitrary records.
- **External references stay `TEXT`, not foreign keys**, when they point
  at another system's id (`jobberRef`, `qboRef`, Jobber's `jobberId`/
  `jobberEstimateRef`) — AgentOS doesn't own that data, so a foreign key
  would be a false promise of referential integrity Postgres can't
  actually guarantee.
- **`prohibited_never_approved` CHECK constraint** on `action_proposals` —
  a database-level backstop matching `src/approvals/engine.ts`'s
  application-level guarantee that a `prohibited`-class proposal can never
  reach an approved/executing/completed status. Two independent
  enforcement layers, as the existing code comment in `engine.ts` already
  describes for the application layer alone.
- **`outbound_requires_consent` CHECK constraint** on `voice_calls` —
  same pattern, backing AT-16's consent guardrail at the schema level.
- **No payment/bank-write columns anywhere.** `accounting_items` has no
  "pay" action, no bank account reference, no payment-initiation field of
  any kind — Tier 4 (`01_MASTER_SPEC.md`) stays structurally absent from
  the schema, not just policy-disallowed.
- **Append-only tables** (`audit_events`, `approval_decisions`,
  `event_log`) get `UPDATE`/`DELETE` revoked from `agentos_app` at the
  grant level (see `0004`'s trailing comment — commented out because the
  role doesn't exist yet at that point in a fresh run; DEPLOYMENT_GUIDE.md
  gives the exact one-time command).
- **KPI history stored as strings, not normalized numbers.** `kpi_observations.value`
  is `TEXT` (e.g. `"48.0 hrs (median)"`), matching exactly what
  `src/repositories/kpi-observations.ts` records today. A real
  forecasting feature will need a numeric, unit-aware version of this
  table — deliberately not invented here, since the current application
  code has no numeric KPI model to migrate from (`BUILD_STATUS_V2.md`).
- **`knowledge_items.scope_type`** anticipates the Milestone 8 gap noted in
  `BUILD_STATUS_V2.md` ("scope isn't attached to the actual KnowledgeItem
  records yet") — added here since a real migration is the natural place
  to close it, defaulted to `'company'` so existing rows aren't broken.

## Indexing strategy

Every tenant-scoped table is indexed on `tenant_id` first (either as the
leading column of a composite index, or implicitly via the RLS policy scan
path) since every real query is tenant-scoped by construction. Beyond that,
indexes were added for the specific access patterns the existing repository
code actually performs — e.g. `idx_leads_tenant_sla` is a partial index
(`WHERE responded_at IS NULL`) matching `leadsOutsideSla()`'s exact
predicate in `src/repositories/sales.ts`, not a generic index added
speculatively.

## Backup, restore, retention

**Not yet decided — Owner Decision + Human-Developer Implementation**,
dependent on which managed Postgres provider is chosen
(`PRODUCTION_ARCHITECTURE.md` §3). Design constraints to carry into that
decision:

- Point-in-time recovery (PITR) is a baseline requirement for a system
  that stores approval/audit history — losing an hour of approval
  decisions to a bad deploy is not acceptable for a governance product.
  Any managed provider selected should support continuous WAL archiving
  and PITR (RDS, Cloud SQL, Neon, and Supabase all do).
- Retention: `tenants.deleted_at` is a soft-delete column, deliberately —
  a tenant offboarding should not hard-delete audit history immediately.
  The actual retention period (30/90/365 days before hard delete) is a
  business/legal decision for the Owner, not a technical one this pass
  can make.
- `audit_events` will be the fastest-growing table by a wide margin.
  Partitioning it by month (declarative partitioning on `occurred_at`) is
  a reasonable future optimization once real usage volume is known — not
  done now, since partitioning a table with no production data yet would
  be premature.

## Integration credentials (added Phase 3A)

`0006_integration_credentials.sql` adds `integration_credentials` — the
"dedicated `integration_credentials` table" design `INTEGRATION_SECURITY.md`
names as one of two acceptable token-storage options. Same tenant-scoped
RLS pattern as every other table above; verified against a real local
Postgres 16 instance (`db/verify-integration-credentials-rls.sql`,
including an explicit check that no plaintext-shaped token column exists).
`token_ciphertext` is opaque `BYTEA` the application layer encrypts/decrypts
using a key identified by `encryption_key_id` — this schema has no
dependency on, and no opinion about, which KMS/secrets-manager provider is
eventually chosen (that remains a Lane 4 Owner Decision,
`PRODUCTION_READINESS_CHECKLIST.md`). No application code writes to this
table yet — no real OAuth flow exists to populate it.

## What's NOT in this schema (explicitly)

- No billing/subscription tables — `PRODUCTION_ARCHITECTURE.md` §11 notes
  this is unbuilt; the `module_entitlements` table this schema does include
  is the licensing *state*, not the billing *transaction* history.
- No background-job/queue tables — a real queue product (see
  `PRODUCTION_ARCHITECTURE.md` §9) typically owns its own schema.

## How to apply this

```bash
# 1. As a real database superuser (see DEPLOYMENT_GUIDE.md for where the
#    generated passwords should live — never inline on a real command line):
psql -v migrator_password="'...'" -v app_password="'...'" \
     -v provisioning_password="'...'" -f db/migrations/0000_roles_and_setup.sql

# 2. As agentos_migrator, in order:
for f in db/migrations/000{1,2,3,4,5,6}_*.sql; do psql -U agentos_migrator -f "$f"; done

# 3. Verify isolation actually works, connected as agentos_app:
psql -U agentos_app -f db/verify-rls.sql
psql -U agentos_app -f db/verify-integration-credentials-rls.sql
```

This exact sequence has been run against a local Postgres 16 instance
(most recently in Phase 3A, adding `0006`) and produced a clean pass — see
`BUILD_STATUS_V2.md` for the real bugs found and fixed along the way, and
`DATABASE_MIGRATION_HANDOFF.md` for the field-by-field completeness audit
and repository-by-repository map a developer needs to actually replace
`src/data/store.ts`'s internals with queries against this schema.
