# AgentOS — Database Migration Handoff Package

Phase 3A deliverable (`PRODUCTION_READINESS_CHECKLIST.md` Lane 1 item 9:
"Prepare the production PostgreSQL migration/handoff package so a human
developer can replace the current store implementation without changing
the application/domain contracts"). This document is the package —
everything a human developer needs to actually do the swap in
`PRODUCTION_READINESS_CHECKLIST.md` Lane 2 ("Replace `src/data/store.ts`'s
internals with real queries against the schema in `DATABASE_DESIGN.md`").

**What this document is not**: it is not the swap itself. Writing and
testing real parameterized SQL queries against a live database is
Human-Developer Implementation — it needs judgment about a query layer
(raw `pg` vs. an ORM/query-builder), connection pooling, and transaction
boundaries that this phase's own guardrails put outside Claude-safe scope.
What follows is verified preparation: a completeness audit proving the
schema (`DATABASE_DESIGN.md`, `db/migrations/`) actually covers everything
the current in-memory store holds, and an exact map of the seam a
developer implements against.

## The contract: what must not change

Every piece of the application above the data layer — API routes
(`src/app/api/**`), pages (`src/app/**`), components, `@/core`
(`src/core/index.ts`) — calls only the exported functions in
`src/repositories/*.ts`. None of them import `@/data/store` directly
(enforced by the Phase 3A import-boundary ESLint rule, `.eslintrc.json`
`overrides` — see `IP_BOUNDARY.md`). This means the swap has exactly one
job: **reimplement the body of each function in `src/repositories/*.ts` to
query Postgres instead of an in-memory object, without changing any
function's name, parameter types, or return type.**

If a function's signature doesn't change, nothing that calls it needs to
change — not the 21 API routes, not any page, not any test that asserts
against a repository function's return shape. This is verifiable
mechanically: `npm run typecheck` staying clean after the swap, with zero
edits outside `src/repositories/*.ts` (and `src/data/*.ts` itself, which
callers never touch), is the single strongest signal the contract held.

**Out of scope for the swap** (stays exactly as-is, calls the swapped
repository functions the same way it calls them today):
- `src/cohen/orchestrate.ts` (`buildTop3`) — ranking logic, not a query.
- `src/approvals/engine.ts` — the approval state machine, operates on an
  `ActionProposal` object a repository function fetched; it has no
  database access of its own today and shouldn't gain any.
- `src/audit/log.ts`, `src/events/bus.ts` — currently their own in-memory
  stores; whether these move into Postgres too (`audit_events`,
  `event_log` already exist in `0004_events_memory_audit.sql`) is a
  separate decision from the `Store` swap this document scopes, since
  `recordEvent`/`publishEvent` are called from many places beyond the
  repositories covered below.

## Completeness audit: every `Store` field has a table (verified, not assumed)

`src/data/store.ts`'s `Store` interface has 19 fields. Checked directly
against `CREATE TABLE` statements in `db/migrations/` (not inferred from
`DATABASE_DESIGN.md`'s prose) — all 19 have a 1:1 table:

| `Store` field | Table | Migration |
|---|---|---|
| `users` | `users` | `0001` |
| `agents` | `agents` | `0002` |
| `agentRuns` | `agent_runs` | `0002` |
| `sourceRecords` | `source_records` | `0003` |
| `findings` | `findings` | `0003` |
| `recommendations` | `recommendations` | `0003` |
| `actionProposals` | `action_proposals` | `0003` |
| `approvalDecisions` | `approval_decisions` | `0003` |
| `leads` | `leads` | `0003` |
| `jobs` | `jobs` | `0003` |
| `jobRequirements` | `job_requirements` | `0003` |
| `equipmentItems` | `equipment_items` | `0003` |
| `safetyRequirements` | `safety_requirements` | `0003` |
| `accountingItems` | `accounting_items` | `0003` |
| `customerCases` | `customer_cases` | `0003` |
| `voiceCalls` | `voice_calls` | `0003` |
| `knowledgeItems` | `knowledge_items` | `0003` |
| `integrationSettings` | `integration_settings` | `0003` |
| `notifications` | `notifications` | `0003` |

No `Store` field is missing a table, and no migration table exists without
a corresponding `Store` field except the ones that don't need one — see
below.

**Tables with no `Store` field, and why that's correct, not a gap:**
- `tenants`, `tenant_memberships`, `module_entitlements` (`0001`) — the
  multi-tenant layer `src/lib/tenant-context.ts` reads today from
  hardcoded config (`src/config/tenant.ts`), not from `Store`. Wiring
  these up is part of the separate multi-tenant-storage punch-list item
  (`README.md` "Human-developer punch list" #3), not this swap.
- `agent_registry_entries`, `workflow_definitions`, `workflow_versions`,
  `tenant_workflow_overrides` (`0002`) — today these are hand-authored
  TypeScript config (`src/config/agent-registry.ts`,
  `src/config/workflows.ts`), read directly by `@/core`'s re-export, not
  through `Store`. The tables exist for the future per-tenant
  customization `DATABASE_DESIGN.md` already notes; wiring them up is a
  separate, later decision, not required for this swap to be complete.
- `audit_events`, `event_log`, `decisions`, `outcomes`, `kpi_observations`
  (`0004`) — `src/audit/log.ts` and `src/events/bus.ts` are their own
  in-memory arrays, not part of `Store`; `decisions`/`outcomes` are
  derived at read time by `src/repositories/decisions.ts` from
  `actionProposals`/`approvalDecisions`, not stored; `kpi_observations`
  is written by `src/repositories/kpi-observations.ts` directly via
  `getStore()` today, effectively already `Store`-adjacent — see its row
  in the table below.
- `integration_credentials` (`0006`) — no application code writes to this
  table yet (no real OAuth flow exists); see `INTEGRATION_SECURITY.md`.

## Computed fields — do not expect a column for these

Some data the UI displays is computed at read time, not stored. A
straight "copy the column" mental model will miss these; each one needs
its logic ported into the new query (as a computed `SELECT` expression,
or into the application code that calls the query) rather than expecting
Postgres to hand it back as-is:

| Field | Computed by | Note |
|---|---|---|
| `Agent.openFindingsCount` | `computeOpenFindingsCounts()` in `src/data/store.ts`, run once at store build | Not a column on `agents`. Real implementation: `COUNT(*) FROM findings WHERE agent_id = $1 AND status = 'open' AND tenant_id = $2`, either as a subquery/join in `listAgents()`/`getAgent()`, or computed application-side after the two queries. |
| `Recommendation.cohenRank` | `buildTop3()` in `src/cohen/orchestrate.ts`, called by `reRank()` (`src/repositories/recommendations.ts`) after every status change | Stays application logic (out of scope for this swap, see above) — but the swapped `updateRecommendationStatus()` must still call `reRank()` and persist the result back, the same way it does today. |
| `Job.readinessStatus` / `readinessScore` | Set directly in seed data today (`03_GAP_ANALYSIS.md`, `BUILD_STATUS_V2.md` Milestone 11: "descriptive, not computed") | Genuinely a stored column (`jobs.readiness_status`/`readiness_score` in `0003`) — not computed, just not yet computed *from* anything live. No special handling needed for this swap. |
| `KPIObservation` rows | Written by `recordKpiObservations()` (`src/repositories/kpi-observations.ts`), which reads current, real KPI values off the *other* repositories at the moment it's called | This one function does span two concerns — reading live KPI values (via the other swapped repositories) and inserting an observation row. Keep the same shape: compute the snapshot from the already-swapped repository functions, then `INSERT INTO kpi_observations`. |

## Read-model repositories — do not give these their own table

Some repository files have **no matching `Store` field at all** because
they're pure aggregations over other repositories, not their own data:
`src/repositories/divisions.ts`, `src/repositories/home.ts`,
`src/repositories/work-queue.ts`, `src/repositories/tracked.ts`,
`src/repositories/decisions.ts`. Once the repositories they call are
swapped, these should work with **no changes at all** (they call
`listAgents()`, `listProposals()`, etc. — not `getStore()` directly) —
verified by reading each file: none of them import `@/data/store`. Leave
them alone; re-verify after the swap that they still typecheck and their
existing tests still pass, but don't write new queries for them.

## Repository-by-repository map

Every exported function, and the table(s) its real implementation would
query. `tenant_id = <current tenant>` is implied on every query (RLS
enforces it as defense-in-depth; the application should still filter
explicitly — see `DATABASE_DESIGN.md` "Row-Level Security").

| Repository file | Functions | Table(s) |
|---|---|---|
| `accounting.ts` | `listAccountingItems`, `billsDueSoon`, `depositsExpected`, `statementsNeedingCrossCheck`, `exceptions` | `accounting_items` |
| `activity.ts` | `listActivity`, `listNotifications` | `event_log` or `audit_events` (see "out of scope" above — only if that migration is adopted); `notifications` |
| `agents.ts` | `listAgents`, `getAgent`, `runsForAgent`, `markAgentRunTriggered` | `agents`, `agent_runs`, `findings` (for `openFindingsCount`, see above) |
| `approvals.ts` | `listProposals`, `getProposal`, `decideApprove`, `decideEditAndApprove`, `decideReject`, `decideClarify` | `action_proposals`, `approval_decisions` |
| `customers.ts` | `listCustomerCases`, `getCustomerCase`, `openCustomerCases` | `customer_cases` |
| `integrations.ts` | `listIntegrations`, `testIntegrationConnection` | `integration_settings` (`testIntegrationConnection` calls the mock adapter, not the database — unchanged) |
| `knowledge.ts` | `listKnowledgeItems`, `pendingSopReview` | `knowledge_items` |
| `kpi-observations.ts` | `recordKpiObservations`, `listKpiObservations` | `kpi_observations` (see "computed fields" above) |
| `operations.ts` | `listJobs`, `getJob`, `requirementsForJob`, `equipmentForJob`, `jobsAtRisk`, `jobsWithMissingCloseout`, `todaysAndNextDayJobs` | `jobs`, `job_requirements`, `equipment_items` |
| `recommendations.ts` | `listRecommendations`, `getRecommendation`, `findingsByIds`, `top3Recommendations`, `reRank`, `updateRecommendationStatus` | `recommendations`, `findings` |
| `safety.ts` | `listSafetyRequirements`, `missingOrEscalatedJsa`, `ladderInspections`, `safetyEvidenceMissingCount` | `safety_requirements` |
| `sales.ts` | `listLeads`, `getLead`, `leadsOutsideSla`, `salesKpis`, `competitorSignals` | `leads` (`competitorSignals` and `salesResponseSlaMinutes` don't touch `Store` at all today — leave as-is) |
| `voice.ts` | `listVoiceCalls`, `voiceKpis` | `voice_calls` |

**Not in scope for the swap** (already covered above): `cohen.ts` (wraps
`@/cohen/ask-cohen`, no store access), `divisions.ts`, `home.ts`,
`work-queue.ts`, `tracked.ts`, `decisions.ts`, `events.ts` (wraps
`@/audit/log`, separate decision).

## Tenant context — the one real behavior change this swap requires

Today every repository function implicitly operates on the single
hardcoded Valley River tenant (`getStore()` returns one process-wide
object). Once real queries run against a multi-tenant schema, every query
needs a `tenant_id`, sourced from `src/lib/tenant-context.ts` (already
tenant-aware, `getCurrentTenant()`), **not from a client-supplied
parameter** — the same rule `DATABASE_DESIGN.md` states for `SET
app.current_tenant_id`. This is real, necessary scope for the swap, not
optional: a function that silently defaults to "the only tenant" the way
today's code does would break the moment a second tenant exists.

## How to apply the schema (updated for Phase 3A)

```bash
# 1. As a real database superuser:
psql -v migrator_password="'...'" -v app_password="'...'" \
     -v provisioning_password="'...'" -f db/migrations/0000_roles_and_setup.sql

# 2. As agentos_migrator, in order (0006 added this phase):
for f in db/migrations/000{1,2,3,4,5,6}_*.sql; do psql -U agentos_migrator -f "$f"; done

# 3. Verify isolation actually works, connected as agentos_app:
psql -U agentos_app -f db/verify-rls.sql
psql -U agentos_app -f db/verify-integration-credentials-rls.sql
```

Both verification scripts were re-run against a real local Postgres 16
instance this phase (`0006` added and verified alongside them) — see
`BUILD_STATUS_V2.md` "Phase 3A" for the full assertion list.

## Acceptance criteria for the swap

A human developer's PR doing this swap should be able to demonstrate all
of the following, mirroring how every prior change in this project has
been verified (not just asserted):

1. `npm run typecheck` passes with **zero changes outside
   `src/repositories/*.ts` and `src/data/*.ts`** — proof the contract held.
2. `npm run lint` passes, including the import-boundary rule — proof no
   route/page/component started reaching past `@/core` to work around the
   swap.
3. The existing test suite (`npm run test`) passes against the new
   implementation. Tests that call `_resetStoreForTests()`
   (`src/data/store.ts`) will need an equivalent "reset to a known seeded
   state" for a real database — a `TRUNCATE ... CASCADE` + reseed inside a
   transaction rolled back per test, or a dedicated test database reset
   between runs, are both reasonable; which one is a judgment call for
   whoever does this work.
4. A live smoke test — start the app, approve/reject a real proposal
   through the actual UI or API, confirm it persists across a server
   restart without relying on `src/data/persistence.ts`'s SQLite
   stopgap (which should be removed once this swap lands, per
   `README.md`'s punch list item 1).
5. `db/verify-rls.sql` and `db/verify-integration-credentials-rls.sql`
   both still pass against the actual deployed schema, not just a
   throwaway verification database.
