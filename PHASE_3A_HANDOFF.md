# AgentOS — Phase 3A Human Developer Handoff Package

Phase 3A ("Production Foundation Preparation") completed every item
classified Lane 1 / Claude-safe in `PRODUCTION_READINESS_CHECKLIST.md` —
additive, testable, reversible work needing no external credentials and
no owner decision. This document is the handoff package for what comes
next: what's done, what changed, what infrastructure is still required,
exactly what a human developer does from here, what credentials the
owner needs to provide, how to verify the work is correct, and what must
never change regardless of who's implementing it.

For the full narrative and verification evidence behind every claim here,
see `BUILD_STATUS_V2.md` "Phase 3A — Production Foundation Preparation."
This document is the action-oriented companion to that record, not a
replacement for it.

## 1. Work completed

Nine items, all verified (not just written) — typecheck, lint, the full
test suite, a production build, and in most cases a live smoke test
against a running server, after every one:

1. **Strict zod validation on every API route.** Every write-capable
   route (`approvals/[id]/{approve,reject,clarify}`, `cohen/chat`) and
   every validated GET route's query parameters (`kpis`, `activity`,
   `approvals`) now reject malformed input with a precise 400 instead of
   silently coercing it or (in two cases) not validating it at all.
2. **Production HTTP security headers** — `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
   `X-DNS-Prefetch-Control`, verified live via `curl -I`. CSP and HSTS
   deliberately deferred (need real infra decisions first).
3. **CI workflow** — `.github/workflows/ci.yml` runs
   typecheck/lint/test/build on every push/PR.
4. **Sanitized external-developer seed dataset** —
   `src/data/seed.external-dev.ts`, selected via
   `AGENTOS_SEED_DATASET=external-dev`, verified free of every real
   customer/staff/vendor/place name.
5. **Core/Dashboard import boundary — enforced, not just documented.** An
   ESLint rule now mechanically blocks Dashboard-layer code from
   importing Core internals except through `@/core`.
6. **Direct-repository-access conversion.** All 21 API routes and 19
   pages now import via `@/core`; three places that reached past the
   repository layer entirely got new, narrow repository-layer wrapper
   functions instead.
7. **`integration_credentials` schema**, ciphertext-only, encryption/KMS
   integration correctly left abstract — verified against a real local
   Postgres 16 instance (6/6 RLS assertions passed).
8. **26 new tests** (79/79 passing, up from 53/53) covering the new
   validation, tenant-isolation/authorization edge cases, and a
   route-level defense-in-depth check on prohibited actions.
9. **`DATABASE_MIGRATION_HANDOFF.md`** — a verified completeness audit and
   repository-by-repository map preparing (not implementing) the Lane 2
   database swap.

## 2. Files changed

**New files:**
```
.github/workflows/ci.yml
DATABASE_MIGRATION_HANDOFF.md
PHASE_3A_HANDOFF.md                          (this file)
db/migrations/0006_integration_credentials.sql
db/verify-integration-credentials-rls.sql
src/data/seed.external-dev.ts
src/lib/validation.ts
src/repositories/cohen.ts
tests/api-validation.test.ts
```

**Modified — documentation:**
```
BUILD_STATUS_V2.md
DATABASE_DESIGN.md
HUMAN_DEVELOPER_HANDOFF.md
INTEGRATION_SECURITY.md
PRODUCTION_ARCHITECTURE.md
PRODUCTION_READINESS_CHECKLIST.md
README.md
```

**Modified — config/dependencies:**
```
.eslintrc.json          (import-boundary rule)
next.config.js          (security headers)
package.json / package-lock.json   (zod added)
```

**Modified — Core boundary/repositories:**
```
src/core/index.ts
src/data/store.ts                          (seed-dataset selection)
src/repositories/agents.ts                 (+ markAgentRunTriggered)
src/repositories/index.ts                  (+ cohen.ts export)
src/repositories/integrations.ts           (+ testIntegrationConnection)
src/repositories/recommendations.ts        (+ findingsByIds)
```

**Modified — all 21 API routes** (import-source change to `@/core`, plus
zod validation on the write-capable and query-parameterized ones):
```
src/app/api/accounting/route.ts
src/app/api/activity/route.ts
src/app/api/agents/route.ts
src/app/api/agents/[id]/run/route.ts
src/app/api/approvals/route.ts
src/app/api/approvals/[id]/approve/route.ts
src/app/api/approvals/[id]/clarify/route.ts
src/app/api/approvals/[id]/reject/route.ts
src/app/api/cohen/chat/route.ts
src/app/api/customers/cases/route.ts
src/app/api/home/route.ts
src/app/api/integrations/route.ts
src/app/api/integrations/[id]/test/route.ts
src/app/api/knowledge/route.ts
src/app/api/kpis/route.ts
src/app/api/operations/jobs/route.ts
src/app/api/operations/jobs/[id]/route.ts
src/app/api/recommendations/route.ts
src/app/api/recommendations/[id]/route.ts
src/app/api/safety/route.ts
src/app/api/sales/leads/route.ts
src/app/api/voice/calls/route.ts
```

**Modified — 19 pages/layout** (import-source change to `@/core` only,
zero logic change):
```
src/app/accounting/page.tsx, agents/page.tsx, agents/[id]/page.tsx,
approvals/page.tsx, customers/page.tsx, deadlines/page.tsx,
divisions/page.tsx, divisions/[key]/page.tsx, knowledge/page.tsx,
layout.tsx, operations/page.tsx, operations/[id]/page.tsx, page.tsx,
safety/page.tsx, sales/page.tsx, settings/governance/page.tsx,
settings/integrations/page.tsx, settings/permissions/page.tsx,
settings/workflows/page.tsx, tracked/page.tsx, voice/page.tsx,
work-queue/page.tsx
```

**Modified — 7 components** (import-source change; 2 of these —
`StageTracker.tsx`, `AskCohenPanel.tsx` — are the documented `"use
client"` exceptions to the import-boundary rule, still importing directly
from `@/approvals/stages`/`@/cohen/ask-cohen` because `@/core` would pull
server-only code into their client bundle):
```
src/components/approvals/StageTracker.tsx
src/components/cohen/AskCohenPanel.tsx
src/components/home/DivisionHealthGrid.tsx, HealthStrip.tsx,
  NeedsAttention.tsx, NothingLeftBehind.tsx
src/components/sales/CompetitorSignals.tsx, LeadCard.tsx
```

**Modified — tests:**
```
tests/authorization-model.test.ts   (+3 edge-case tests)
tests/tenant-isolation.test.ts      (+1 edge-case test)
```

## 3. Production infrastructure still required

Nothing in Phase 3A stood up real infrastructure — it prepared for it.
Still entirely missing before this can run as a real product:

- A real, managed PostgreSQL 16 instance (schema is ready and verified
  against a local instance, `DATABASE_DESIGN.md`).
- Real authentication — every session is still one hardcoded demo user
  (`src/lib/auth.ts`).
- Real multi-tenant storage — `src/lib/tenant-context.ts` is still
  single-tenant-shaped.
- Real vendor integration connections — all 15 remain typed mocks with no
  live credentials, no write capability.
- A KMS/secrets-manager integration for `integration_credentials` — the
  table exists, nothing encrypts/decrypts against it yet.
- Rate limiting, structured logging/monitoring, a background-job/workflow
  execution engine, a hosting deployment of any kind.
- A physical Core/Dashboard repository split — the import boundary that
  makes this mechanical now exists (`@/core`); the actual second
  repository and network/process separation do not.

## 4. Exact developer tasks

In the order `PRODUCTION_READINESS_CHECKLIST.md` Lane 2 lists them, with
what's already prepared for each:

1. **Replace `src/data/store.ts`'s internals with real Postgres queries.**
   Follow `DATABASE_MIGRATION_HANDOFF.md` exactly — it has the
   completeness audit, the computed-fields call-outs, and the
   repository-by-repository target-table map already done. Pick a query
   layer (raw `pg` or an ORM — not prescribed). Acceptance criteria are in
   that document's final section.
2. **Physically split the repository** (`PRODUCTION_ARCHITECTURE.md` §2
   Option A, steps 3-4). Step 1 (enumerate the seam) is done — everything
   importing `@/core` is Dashboard-layer, everything behind it is Core.
   Steps 3 (convert Server Components to call Core over HTTP) and 4
   (physical split) remain, and should happen together — see
   `PRODUCTION_ARCHITECTURE.md` §2 for why they weren't done separately in
   Phase 3A.
3. **Wire real authentication** once a provider is chosen (needs an Owner
   Decision first — see §5). Replace `getCurrentUser()`'s hardcoded return
   with real session reading; wire `hasAtLeastTenantMembership()`
   (already built, `src/lib/tenant-context.ts`) into every route.
4. **Build the tenant-onboarding flow** using the `agentos_provisioning`
   database role (already defined, `db/migrations/0000_roles_and_setup.sql`).
5. **Implement rate limiting.**
6. **Implement structured logging + monitoring** once a provider is
   chosen (§5).
7. **Build the background-job/workflow-execution engine** — the largest
   remaining project; `src/events/dispatcher.ts` currently only routes an
   event to a workflow and logs the decision, it doesn't execute steps.
8. **Real vendor adapter implementations**, one at a time, starting with
   Jobber — follow `INTEGRATION_SECURITY.md`'s OAuth/token-storage
   architecture, storing tokens in the now-ready
   `integration_credentials` table.
9. **Manual accessibility pass** — automated linting (full `jsx-a11y`
   ruleset) found zero violations; still need color-contrast, real
   keyboard-navigation, and screen-reader verification.
10. **Dependency vulnerability remediation** — `npm audit` reports 10
    advisories, all requiring a semver-major upgrade (`next` 14→16,
    `vitest` 2→4). Plan and test this deliberately; do not
    `npm audit fix --force` as a side effect of other work.

## 5. Credentials/accounts required from the owner

None of these exist yet. Each is an Owner Decision
(`PRODUCTION_READINESS_CHECKLIST.md` Lane 4) that blocks one or more tasks
above:

- **Hosting platform** account (Vercel or a container host).
- **Managed PostgreSQL provider** account — must support Postgres 16 with
  `pgcrypto`/`citext`, ideally with point-in-time-recovery backups.
- **Authentication provider** account (Auth0/Clerk/WorkOS/self-hosted/
  NextAuth with a credentials provider).
- **Secret manager / KMS provider** account — needed before
  `integration_credentials` can hold anything real.
- **Monitoring/alerting provider** account.
- **Billing/subscription provider** account, once SaaS onboarding is
  scoped.
- **Per-vendor sandbox/developer credentials** for each of the 15
  integrations, starting with Jobber — real production credentials should
  never be handed to a contracted developer; see
  `HUMAN_DEVELOPER_HANDOFF.md` "Access control mechanics."

Also needed, not a vendor credential but still an owner-only decision:
data-retention period for soft-deleted tenants (legal/business call), and
independent confirmation of the 60-minute Valley River lead-response SLA
against real operations before any of this goes live.

## 6. Acceptance tests developers must pass

Before any Phase 3A-adjacent change is considered done:

- `npm run typecheck` — zero errors.
- `npm run lint` — zero warnings, **including the import-boundary rule**
  (a new violation here means Dashboard-layer code reached past `@/core`
  again).
- `npm run test` — the full suite passes (79/79 as of Phase 3A; a real
  database swap will need an equivalent to `_resetStoreForTests()` for a
  real database — see `DATABASE_MIGRATION_HANDOFF.md` acceptance criteria
  point 3).
- `npm run build` — succeeds; route count should only change if pages/API
  routes were intentionally added or removed.
- `db/verify-rls.sql` and `db/verify-integration-credentials-rls.sql` —
  both must still pass against whatever database is actually deployed to,
  not just a local verification instance.
- A live smoke test appropriate to the change: for the DB swap, the same
  test already proven for the SQLite stopgap — mutate a proposal through
  the real API, restart the process, confirm the mutation persisted —
  should be repeated against the real database before calling it done.
- For any change touching the approval flow specifically: re-run (or
  extend) `tests/approvals-engine.test.ts` and `tests/api-validation.test.ts`'s
  prohibited-action route-level test — both must still pass unmodified in
  their assertions, only their setup may need to change for a real
  database.

## 7. Prohibited architectural changes

Non-negotiable regardless of who implements what comes next
(`CLAUDE.md`, carried through every phase of this project):

- **Never let any code path bypass `src/approvals/engine.ts`** for a
  consequential action. The zod validation layer added this phase sits
  strictly in front of the engine, rejecting bad input before it reaches
  it — it must never be modified to skip, weaken, or work around the
  engine's own checks.
- **Never implement autonomous bank/payment movement.** No schema table,
  no adapter capability, no code path may ever initiate a bank transfer or
  payment without human approval — `resolvePostApprovalStatus()`'s
  hard-coded `hasLiveWriteAdapter = false` and the complete absence of any
  payment-initiation column in `db/migrations/` must both remain true.
- **Never silently grant tenant access.** Every tenant/entitlement lookup
  must continue returning nothing for an unrecognized pairing — verified
  by `tests/tenant-isolation.test.ts`/`tests/authorization-model.test.ts`
  and, at the database layer, by both `db/verify-rls.sql` scripts. A
  "default tenant" fallback of any kind is prohibited.
- **Never promote an agent's trust state, or build a promotion mechanism
  that runs without explicit human review**, without that being a
  separate, explicit Owner Decision — not a side effect of unrelated work.
  `src/config/agent-registry.ts` should not gain a `trusted_auto`
  classification or a Tier 4 entry without that decision being made and
  documented first.
- **Never widen the Core/Dashboard import boundary** to make development
  more convenient. If `@/core` doesn't yet re-export something Dashboard
  code needs, add the export there deliberately — never disable or
  loosen the ESLint rule, and never revert a page/component back to
  importing a Core-internal module directly.
- **Never give external contracted developers unrestricted repository
  access** "for convenience" ahead of the physical Core/Dashboard split —
  follow `HUMAN_DEVELOPER_HANDOFF.md`'s access-control mechanics exactly.
- **Never convert a mocked integration into a claimed-working one** without
  it actually being connected with real, tested credentials — no
  "looks-done" adapters.
- **Never remove an existing test to make a change pass**, and never run
  `npm audit fix --force` (or any other broad, untested dependency
  upgrade) as a side effect of unrelated work — both are explicitly
  planned, deliberate efforts, not incidental ones.
