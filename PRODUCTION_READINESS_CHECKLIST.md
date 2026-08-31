# AgentOS — Production Readiness Checklist

The actionable expansion of `PRODUCTION_ARCHITECTURE.md`'s summary table.
Every item is labeled **Completed**, **Mocked**, **Blocked External**, or
**Human Review Required**, and grouped into the four lanes the phase brief
asked for. This is the single document to work down, in order, toward a
secure, commercially-deployable AgentOS.

## Lane 1 — Claude-safe implementation (no external credentials, no owner decision needed)

Work that's genuinely safe for an AI agent (this session or a future one)
to pick up directly — additive, testable, reversible, no infrastructure or
business decision required.

- [ ] Add zod (or equivalent) request-body schema validation to each API
      route, starting with the write-capable ones (`SECURITY_ARCHITECTURE.md`
      "Input validation").
- [ ] Add `db/migrations/000X_...sql` for `integration_credentials` once
      the token-storage design (`INTEGRATION_SECURITY.md`) is chosen — the
      table shape can be written and tested against real Postgres now,
      encryption-at-rest specifics can follow.
- [ ] Write the sanitized generic seed dataset for external-developer local
      dev (`HUMAN_DEVELOPER_HANDOFF.md` "Sanitized local-dev seed data").
- [ ] Add a `/api/health` route once a real database exists to check
      (`SECURITY_ARCHITECTURE.md` "Health checks") — trivial once §Lane 2's
      DB swap has landed enough to have something to check.
- [ ] Add `next.config.js` security headers (`SECURITY_ARCHITECTURE.md`
      "Security headers") — CSP needs tuning once real third-party script
      sources are known, but the non-CSP headers (`X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy`) are safe to add now.
- [ ] Write a CI workflow file running the existing four commands
      (`typecheck`/`lint`/`test`/`build`) — safe and mechanical
      (`DEPLOYMENT_GUIDE.md` "CI/CD"), even before a hosting target is
      chosen.
- [ ] Add an import-boundary ESLint rule (`eslint-plugin-boundaries` or
      similar) enforcing that `src/app/**` and `src/components/**` only
      import from `@/core` and type-shape files, not `@/repositories/*`
      directly — makes `src/core/index.ts` (this phase) actually
      enforced, not just documented.
- [ ] Convert remaining direct `@/repositories` imports in Server
      Components into calls against existing (or newly-added) API routes
      — the mechanical part of `PRODUCTION_ARCHITECTURE.md` §2's Option A,
      doable incrementally, page by page, without waiting for the DB swap.

## Lane 2 — Human-developer-required implementation (needs judgment/testing depth beyond a safe automated pass)

- [ ] Replace `src/data/store.ts`'s internals with real queries against
      the schema in `DATABASE_DESIGN.md` (`db/migrations/`), using a real
      query layer (raw `pg` with parameterized queries, or an
      ORM/query-builder — team preference, not prescribed here).
- [ ] Physically carry out the repository split
      (`PRODUCTION_ARCHITECTURE.md` §2 Option A) once Lane 1's import
      conversion is complete.
- [ ] Wire real authentication once a provider is chosen (Lane 4) —
      replace `src/lib/auth.ts` `getCurrentUser()`'s hardcoded return with
      real session reading; wire `hasAtLeastTenantMembership()`
      (`src/lib/tenant-context.ts`, added this phase) into every API route.
- [ ] Build the tenant-onboarding flow (signup, first-owner invite,
      entitlement assignment) using `agentos_provisioning`
      (`DATABASE_DESIGN.md`).
- [ ] Implement rate limiting (`SECURITY_ARCHITECTURE.md`).
- [ ] Implement structured logging + monitoring integration once a
      provider is chosen (Lane 4).
- [ ] Build the background-job/workflow-execution engine
      (`PRODUCTION_ARCHITECTURE.md` §9) — the largest single remaining
      engineering project in this list.
- [ ] Real vendor adapter implementations, one integration at a time, per
      `INTEGRATION_SECURITY.md` — starting with Jobber, per the original
      v1 plan (`BUILD_STATUS.md`).
- [ ] Formal WCAG 2.1 AA accessibility review: this phase's automated pass
      (`eslint-plugin-jsx-a11y`'s full `recommended` ruleset, now
      permanently part of `.eslintrc.json`, not just a one-off check) found
      **zero violations across all 57 `.tsx` files** — a genuinely clean
      automated baseline, verified by actually running it, not assumed.
      Automated linting cannot catch everything WCAG 2.1 AA requires,
      though — color contrast ratios, real keyboard-navigation flow,
      and screen-reader testing (NVDA/VoiceOver) all need a manual pass
      this phase did not do. Recommended plan: (1) run an automated
      contrast checker (e.g. `axe-core` in CI) against key rendered pages,
      (2) manually keyboard-navigate the approval flow and division
      workspace end to end, (3) one screen-reader pass on the same two
      flows before calling this "AA reviewed."
- [ ] Dependency vulnerability remediation: `npm audit` (re-run this
      phase) reports **10 vulnerabilities (1 critical, 6 high, 3
      moderate)** — every one only fixable via a semver-major breaking
      upgrade (`next` 14→16, `vitest` 2→4). The `next`/`postcss`/`glob`
      chain affects the production bundle; the `vitest`/`esbuild`/`vite`
      chain is dev-only tooling (not shipped to production, lower real
      exposure despite the "critical" label). **Not run in this pass** —
      `npm audit fix --force` was deliberately not executed; a Next.js
      major-version upgrade is exactly the kind of broad, testing-intensive
      change that belongs in Lane 2, planned and tested deliberately, not
      applied as a side effect of a security review.

## Lane 3 — External-credential / vendor-dependent work (blocked until a real account/credential exists)

- [ ] Every real integration connection in `INTEGRATION_SECURITY.md`'s
      table — Jobber, QBO, Google (Calendar/Drive/Gmail), RingCentral,
      CompanyCam, Sortly, Canva, Meta Ads, Google Ads, Facebook leads,
      Google reviews, website forms.
- [ ] A real database instance from whichever managed provider is chosen
      (Lane 4) — schema is ready (`DATABASE_DESIGN.md`), verified against
      a local Postgres; needs the real managed instance to actually
      deploy against.
- [ ] A real auth provider account/app registration (Lane 4).
- [ ] A real secret manager / KMS account (Lane 4).
- [ ] A real monitoring/alerting provider account (Lane 4).
- [ ] A real hosting account (Vercel, or the chosen alternative) (Lane 4).
- [ ] A real billing/subscription provider account, once SaaS onboarding
      (Lane 2) is built.

## Lane 4 — Owner decisions required

Each of these blocks one or more Lane 2/3 items above until decided —
listed once here as the actual decision points, not duplicated per
downstream task.

- [ ] **Hosting platform** (`DEPLOYMENT_GUIDE.md`) — Vercel vs. a general
      container host.
- [ ] **Managed database provider** (`DATABASE_DESIGN.md`) — must support
      Postgres 16 with the extensions used (`pgcrypto`, `citext`) and
      ideally PITR backups.
- [ ] **Authentication provider** (`AUTHORIZATION_MODEL.md`) — e.g.
      Auth0/Clerk/WorkOS/a self-hosted option/NextAuth with a credentials
      provider. Affects `AUTH_PROVIDER` and related env vars
      (`ENVIRONMENT_VARIABLES.example`).
- [ ] **Secret manager / KMS provider** (`SECURITY_ARCHITECTURE.md`,
      `INTEGRATION_SECURITY.md`).
- [ ] **Monitoring/alerting provider** (`SECURITY_ARCHITECTURE.md`).
- [ ] **Billing/subscription provider**, once SaaS onboarding is scoped
      (`PRODUCTION_ARCHITECTURE.md` §11).
- [ ] **Repository split timing** — do it before or after the first
      external developer is engaged (`HUMAN_DEVELOPER_HANDOFF.md`
      "Recommended path" vs. "If you need to hand something over before
      the split is done").
- [ ] **Data retention period** for soft-deleted tenants
      (`DATABASE_DESIGN.md` "Backup, restore, retention") — a legal/business
      call, not a technical one.
- [ ] **Whether/when progressive trust moves any agent past `shadow`/
      `supervised`** (`PRODUCTION_ARCHITECTURE.md` §10) — explicitly not
      this phase's call to make or imply is coming soon.
- [ ] **Confirm the corrected Valley River lead-response SLA (60 minutes,
      set in a prior session per `BUILD_STATUS_V2.md` Milestone 11)**
      against how the business actually operates before this goes to
      production — flagged there as still worth independent owner
      double-checking, restated here since this checklist is the
      "before you ship" list.

## What this phase explicitly did NOT touch

Per the phase brief's own guardrails, verified true of every change made:

- The approval-first philosophy is unweakened — `src/approvals/engine.ts`
  is unmodified; the new `canUserApprove()` wiring (a prior session) and
  the new `hasAtLeastTenantMembership()` (this phase) are both additive
  *more* restrictive checks, never a bypass.
- No autonomous banking/payment capability was added — confirmed no such
  column, table, or code path exists anywhere in `DATABASE_DESIGN.md`'s
  schema or the application code.
- No tenant access is silently granted — `getModuleEntitlements()` (prior
  session) and the new `getTenantMembership()`/`hasAtLeastTenantMembership()`
  (this phase) both return nothing for an unrecognized pairing, verified
  by tests (`tests/tenant-isolation.test.ts`, `tests/authorization-model.test.ts`)
  and, at the database layer, by `db/verify-rls.sql` against a real
  Postgres instance.
- No existing test was removed; 6 new ones were added this phase
  (`tests/authorization-model.test.ts`) — total 53/53 passing, up from 47.
- No mocked integration was changed to claim real operation — every
  `IntegrationSettings` row and every mock adapter is unchanged; the new
  `INTEGRATION_SECURITY.md` document describes architecture for real
  connections without claiming any exist.
