# AgentOS — Production Architecture

Target-state architecture for AgentOS as a proprietary multi-tenant SaaS
platform. This is the umbrella document for the "Production Security, IP
Protection & Commercialization Hardening" phase — it describes what the
system should become and points to the detailed companion documents for
each subsystem. It does not replace `01_MASTER_SPEC.md` (the product spec)
or `BUILD_STATUS_V2.md` (what's actually built) — it sits between them:
this is the *infrastructure and security* target, not the product feature
target.

Every claim below is labeled **Completed**, **Mocked**, **Blocked External**,
or **Human Review Required**, per the project's existing convention
(`BUILD_STATUS_V2.md`). Nothing here is presented as built unless it is.

---

## 1. Where AgentOS is today (baseline)

- Single Next.js 14 App Router application. Server Components and API
  routes both import `src/repositories/*` in-process — no network boundary
  between UI and business logic.
- Single-tenant demo auth (`src/lib/auth.ts`) — one hardcoded user.
- Single-tenant-shaped config (`src/config/tenant.ts`), but a real
  multi-tenant *seam* already exists (`src/lib/tenant-context.ts`,
  `src/domain/platform.ts` `Tenant`/`ModuleEntitlement`) — see
  `AUTHORIZATION_MODEL.md`.
- Local SQLite-file persistence (`src/data/persistence.ts`) — durable
  across a restart on one process, not a real multi-tenant database. See
  `DATABASE_DESIGN.md`.
- All 15 external integrations are typed mocks with no live write
  capability (`src/integrations/mock-adapters.ts`). See
  `INTEGRATION_SECURITY.md`.
- Approval-first governance is real and structurally enforced
  (`src/approvals/engine.ts`) — this is the one subsystem that is already
  production-grade in its logic, if not its infrastructure.

## 2. Core/Dashboard separation — the primary architectural goal

**Status: Human Review Required + Human-Developer Implementation.** The
classification is done (`IP_BOUNDARY.md`); the physical split is not, and
should not be done unilaterally by an automated pass — it changes how the
product is built and deployed going forward, which is exactly the kind of
decision this phase's instructions say to flag rather than execute.

### Target shape

```
┌─────────────────────────┐        HTTPS + auth token        ┌──────────────────────────┐
│   AgentOS Dashboard      │ ────────────────────────────────▶│   AgentOS Core            │
│   (external-dev-safe)    │◀──────────────────────────────── │   (proprietary, private)  │
│                           │         JSON over API_CONTRACT   │                            │
│  src/app/**  (UI only)    │                                  │  src/cohen/**              │
│  src/components/**        │                                  │  src/approvals/**          │
│  domain type SHAPES only  │                                  │  src/events/**             │
│                           │                                  │  src/config/** (policy)    │
│  Deployable separately.   │                                  │  src/repositories/**       │
│  Contracted devs work     │                                  │  src/data/**               │
│  here without ever        │                                  │  src/lib/auth.ts,          │
│  cloning Core.             │                                  │    tenant-context.ts       │
└─────────────────────────┘                                  └──────────────────────────┘
```

### Recommended repository strategy

Three options were considered; **Option A is recommended** as the lowest-risk
path from today's codebase, because most of the HTTP contract already
exists (`src/app/api/**`).

| Option | Description | Effort | Isolation strength |
|---|---|---|---|
| **A — Split into two deployables (recommended)** | `agentos-core` (private repo): everything classified Core in `IP_BOUNDARY.md`, deployed as the existing Next.js app (keep the API routes, drop the pages). `agentos-dashboard` (contractor-visible repo): `src/app/**` pages converted to call Core's API over HTTPS instead of importing repositories directly, plus `src/components/**` and type-shape-only domain files. | Moderate — API routes already exist for most reads; Server Components that currently `import` repositories directly need to switch to `fetch()` calls against those routes, or move into Core's deployment as the "backend for frontend." | Strong — real process/network boundary, real credential boundary |
| B — npm workspaces monorepo, one deployment | `packages/core` + `packages/dashboard` in one repo, enforced by TypeScript project references and an ESLint import-boundary rule (e.g. `eslint-plugin-boundaries`) blocking `packages/dashboard` from importing `packages/core/src/*` directly. | Low | Weak — anyone with repo access still has the source; boundary is a lint rule, not a real wall. Acceptable only for an in-house team, not for external contractors. |
| C — Core as a standalone internal API service, N dashboards | Core is extracted from Next.js into a dedicated API service (e.g., NestJS, or keep Next.js API-routes-only); each tenant or reseller can eventually ship its own themed dashboard against the same Core API. | High | Strongest — matches the long-term "external customers license divisions a la carte" goal in `01_MASTER_SPEC.md`, but is a substantial rewrite, not a hardening pass. |

**Recommendation:** implement Option A now (it is a refactor, not a
rewrite — the API routes are the seam and mostly already exist), and treat
Option C as the natural next step once there is more than one dashboard to
serve (e.g., a licensed reseller). Option B is not recommended for a
product whose stated purpose is protecting IP from contracted external
developers — a lint rule is not a security boundary.

### What Option A concretely requires (Human-Developer Implementation)

1. ~~Enumerate every place a Server Component or page currently imports
   from `@/repositories` directly.~~ **Done, Phase 3A** — every page,
   component, and API route now imports exclusively from `@/core`
   (`src/core/index.ts`), never `@/repositories/*` or any other
   Core-internal module directly, mechanically enforced by an ESLint
   `no-restricted-imports` rule (`.eslintrc.json` `overrides`). This
   collapses what used to be "most pages, scattered" into one seam: a
   single file's export list.
2. For each read/write not yet behind an existing API route, add one
   (follow the pattern in `src/app/api/*/route.ts` — thin handler,
   `getCurrentUser()`/`hasAtLeastRole()` check, zod-validated input
   (`src/lib/validation.ts`, Phase 3A), calls a repository function,
   returns via `src/lib/api.ts`'s `ok()`/`badRequest()`/etc.). Largely
   already true — `API_CONTRACT.md` lists the existing coverage.
3. Move `src/app/**/page.tsx` files to fetch from those routes (via
   `fetch()` with a server-to-server bearer token if kept as Server
   Components calling Core's API, or via a client-side data-fetching layer
   if the Dashboard becomes a separate deployable entirely). **Deliberately
   not done in Phase 3A, and not a natural next increment on top of step
   1** — see the note below on why.
4. Physically split the repository once the import graph has no edges left
   from "dashboard" files into Core files other than the generated/typed
   API client.

This is **not done in this pass** — it is a multi-week engineering project
in its own right, and the instructions for this phase are explicit that
irreversible-feeling architecture changes should be flagged, not
unilaterally executed. What *is* done, safely and reversibly, across the
Hardening phase and Phase 3A:

- **Completed (Hardening phase)** — every Core file now carries an
  explicit `PROPRIETARY — AgentOS Core` header comment, so the boundary is
  unmistakable in the source itself, not just in this document.
- **Completed (Hardening phase)** — `src/core/index.ts` added: a single
  barrel file that re-exports exactly the functions API routes are meant
  to call.
- **Completed (Phase 3A)** — the boundary `src/core/index.ts` only
  *documented* is now *enforced*: an ESLint rule mechanically blocks
  `src/app/**`/`src/components/**` from importing anything Core-internal
  except through `@/core`, and every existing import that violated it has
  been converted. **This is intentionally the Option B mechanism (a lint
  rule, "weak" isolation per the table above) applied as scaffolding
  toward Option A, not a substitute for it.** It was worth doing anyway,
  for two reasons distinct from Option A's real goal: (1) it makes the
  eventual physical split (step 4) mechanical rather than an archaeology
  project — the cut line is now one file's export list, not a scan of
  every page for a stray import; (2) reaching that state required adding
  a small number of new repository-layer functions
  (`markAgentRunTriggered`, `findingsByIds`, `testIntegrationConnection`,
  a `cohen.ts` wrapper — see `BUILD_STATUS_V2.md` "Phase 3A") in place of
  three routes that had been reaching past `@/repositories` into raw
  store/adapter access, which is a real defense-in-depth improvement on
  its own regardless of when the physical split happens. It does **not**
  create a real process/credential boundary — anyone with repository
  access still sees Core's source, exactly as Option B's table entry
  says.
- **Why step 3 (self-`fetch()`ing Server Components) was not done as a
  follow-on to step 1, Phase 3A:** converting every Server Component to
  call its own app's API routes over HTTP, while both still deploy as one
  Next.js process, adds a real network hop and a new failure mode (the
  route call can now fail independently of the page render) for zero
  actual isolation benefit until Core is a separate deployable — the
  isolation Option A is *for* only exists once step 4 happens. Making
  that change now would be exactly the kind of broad, behavior-risking
  change Phase 3A's own guardrails said not to make ("do not build
  additional broad product features," "preserve all existing AgentOS
  behaviour"). `@/core` is the correct interim seam; self-fetching is step
  3's job, done together with (or immediately before) the actual split in
  step 4, not decoupled from it.

## 3. Multi-tenant database

**Status: Designed, not deployed.** See `DATABASE_DESIGN.md` for the full
schema (real SQL DDL, versioned migration files under `db/migrations/`).
Summary: PostgreSQL, `tenant_id` on every business table, row-level
isolation enforced at both the query layer (every repository function
takes/derives a tenant id) and, recommended, Postgres Row-Level Security
policies as defense in depth. Replacing `src/data/store.ts`'s internals
with real queries against this schema is Human-Developer Implementation —
selecting the actual hosting/managed-Postgres provider is an Owner
Decision.

## 4. Authentication & authorization

**Status: Designed + partially scaffolded in code.** See
`AUTHORIZATION_MODEL.md`. Real session-based authentication (a real auth
provider) is Human-Developer Implementation requiring an Owner Decision on
which provider. The role/permission *model* — Owner/Admin/Manager/Employee
plus a future customer-facing role, tenant membership, and per-route
server-side authorization — is designed now and partially scaffolded:
`src/lib/tenant-context.ts` already enforces "no entitlement for an
unrecognized tenant" (tested); this pass extends it with an explicit
tenant-membership check function ready for a real session to call.

## 5. API boundary between Core and Dashboard

See `API_CONTRACT.md` for the full existing route inventory (already a
real, if unenforced, seam) and the target request/response contract style
for new routes.

## 6. Security controls

See `SECURITY_ARCHITECTURE.md` for the full pass across: secrets/credential
management, encryption in transit/at rest, audit logging, rate limiting,
input validation, CSRF/XSS/injection protections for this specific Next.js
architecture, session management, error handling, monitoring/observability,
and backup/recovery.

## 7. Integrations

See `INTEGRATION_SECURITY.md` for the per-vendor OAuth/token-storage
architecture, webhook validation/idempotency design, and current mock
status for all 11 named integrations plus the 4 already in the v1 build.

## 8. Deployment, environments, CI/CD

See `DEPLOYMENT_GUIDE.md`.

## 9. Background jobs, workflow execution, agent sandboxing

**Status: Designed, not built.** Today's event/workflow system
(`src/events/bus.ts`, `dispatcher.ts`, `src/config/workflows.ts`) *routes*
events to matching workflow definitions and records the routing decision —
it does not execute a workflow's steps, and there is no job queue. A real
implementation needs:

- A background job queue (e.g., a managed queue like SQS/Cloud Tasks, or a
  self-hosted option like BullMQ over Redis) — **Human-Developer /
  vendor-dependent**, no queue infrastructure exists in this build.
- A workflow step-executor that consumes queued jobs, calls the relevant
  Core repository functions, and — critically — routes any consequential
  action back through `src/approvals/engine.ts` before it can take effect.
  **This is the one non-negotiable design constraint**: no future executor
  may be built to bypass the approval engine. Tier 4 (restricted) actions
  — bank/payment movement — must remain structurally impossible, not just
  policy-disallowed, exactly as `resolvePostApprovalStatus()` enforces
  today by hard-coding `hasLiveWriteAdapter = false`.
- Agent execution sandboxing: once agents call real LLMs/tools rather than
  the current deterministic mock logic, each agent's tool access should be
  scoped to exactly its `AgentRegistryEntry.requiredPermissions`
  (`src/config/agent-registry.ts`) and nothing wider — this registry
  already exists and is the natural policy source for that sandbox.

## 10. Progressive trust & governance enforcement

**Status: Designed (Milestone 7), policy-view only.** `src/domain/governance.ts`
already models risk tiers and trust states; `/settings/governance` displays
them. No agent auto-executes anything today regardless of trust state — the
approval engine's gate is unconditional. When progressive trust becomes
real (an agent actually auto-executing Tier 1/2 actions after demonstrated
reliability), the promotion/demotion state machine must read real execution
telemetry (not present yet — no execution-history store exists at the
volume needed) and must remain overridable by a human at any time. This is
Human-Developer Implementation, gated on the database work in §3 existing
first (there is nowhere to durably store execution telemetry yet).

## 11. Commercial SaaS onboarding, entitlements, licensing

**Status: Designed (module entitlement model), not built (onboarding flow).**
`ModuleEntitlement` (`src/domain/platform.ts`) and
`getModuleEntitlements()`/`isModuleActive()` (`src/lib/tenant-context.ts`)
already model "which divisions is this tenant licensed for" — this is the
foundation of a la carte licensing per `01_MASTER_SPEC.md`. Missing: a
tenant-provisioning flow (create tenant, assign entitlements, invite first
Owner user), billing/subscription integration, and a real database to store
any of it durably. All Human-Developer Implementation; billing-provider
choice is an Owner Decision.

---

## Summary status table

| Area | Status |
|---|---|
| Core/Dashboard classification | Completed (this pass) |
| Core/Dashboard physical split | Human Review Required + Human-Developer Implementation |
| Multi-tenant DB schema design | Completed (this pass) — see `DATABASE_DESIGN.md` |
| Multi-tenant DB deployed | Blocked External (no database provisioned) |
| AuthN (real login) | Human Review Required (provider choice) + Human-Developer Implementation |
| AuthZ model (roles, tenant membership) | Completed (design) + partial scaffolding (this pass) |
| API boundary contract | Completed (documented) + lint-enforced (Phase 3A) — real process/network split (§2 Option A steps 3-4) still pending |
| Security controls pass | Completed (design) — see `SECURITY_ARCHITECTURE.md` |
| Integration security architecture | Completed (design) — all integrations remain Blocked External |
| Background jobs / workflow execution | Designed, not built |
| Agent sandboxing | Designed, not built |
| Progressive trust enforcement | Designed (Milestone 7), policy-view only — unchanged |
| SaaS onboarding/entitlements | Entitlement model exists; onboarding flow not built |

See `PRODUCTION_READINESS_CHECKLIST.md` for the actionable, ordered list
this table expands into.
