# AgentOS — Valley River Heat Pumps (V2 in progress)

Cohen, Executive AI Manager — a multi-tenant, division-based AI business
operating system. Flagship implementation: Valley River Heat Pumps. Built on
a v1 mock-data dashboard prototype, now being evolved toward the
`01_MASTER_SPEC.md` V2 architecture milestone by milestone.

- **What's implemented, mocked, blocked, or needs human review:**
  `BUILD_STATUS_V2.md` (current — read this first) and `BUILD_STATUS.md`
  (v1 historical record, still accurate where not superseded).
- **What V2 requires:** `01_MASTER_SPEC.md`.
- **Gap analysis (verified against actual code):** `03_GAP_ANALYSIS.md`.
- **Production security, IP protection & commercialization hardening:**
  start at `PRODUCTION_ARCHITECTURE.md`, which links out to
  `SECURITY_ARCHITECTURE.md`, `IP_BOUNDARY.md`, `DATABASE_DESIGN.md`,
  `DATABASE_MIGRATION_HANDOFF.md`, `AUTHORIZATION_MODEL.md`,
  `API_CONTRACT.md`, `INTEGRATION_SECURITY.md`, `DEPLOYMENT_GUIDE.md`,
  `HUMAN_DEVELOPER_HANDOFF.md`, `ENVIRONMENT_VARIABLES.example`, and the
  actionable `PRODUCTION_READINESS_CHECKLIST.md` (every Lane 1 item is now
  complete — see `BUILD_STATUS_V2.md` "Phase 3A" and `PHASE_3A_HANDOFF.md`
  for the developer-facing summary of what's next). **Read
  `IP_BOUNDARY.md` before giving any external developer access to this
  repository.**

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000. No API credentials are required — the app
runs entirely on the seeded mock dataset (`src/data/seed.ts`, expanded from
`sample-data/agentos-demo-data.json`) plus an in-memory store
(`src/data/store.ts`) that resets on every process restart. Verified in this
environment: `npm install`, `npm run typecheck`, `npm run lint`,
`npm run test` (79/79), and `npm run build` (52 routes) all pass cleanly —
see `BUILD_STATUS_V2.md` Milestone 0/12 and "Phase 3A" for the exact
commands run and issues fixed along the way.

To develop against a sanitized, no-real-business-data dataset instead
(e.g. handing this repository to an external developer), set
`AGENTOS_SEED_DATASET=external-dev` before `npm run dev` — see
"External-developer local dev" below.

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # vitest run — approval gating, prohibited actions, AT-0x checks
npm run build        # production build
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs all four on
every push/PR.

## External-developer local dev

```bash
AGENTOS_SEED_DATASET=external-dev npm run dev
```

Runs the app against `src/data/seed.external-dev.ts` — the same shape and
entity coverage as the default dataset, with every real customer name,
staff name, vendor name, and place name replaced by a fictional
equivalent (verified by an explicit leak check — see `BUILD_STATUS_V2.md`
"Phase 3A"). Defaults to the real dataset when unset, so this changes
nothing for normal development. **Set the env var before starting the
process you're testing against** — `npm run dev` picks it up live, but if
you use `npm run build && npm start` instead, set it before the `build`
step too: Next.js statically optimizes some read-only API routes at build
time, so a route built with the default dataset stays on that dataset at
`next start` regardless of the env var at start time.

## The end-to-end demo slice

Per `PROMPT_TO_START_CLAUDE_CODE.md`:

1. Open **Home** (`/`) — Cohen's Top 3 recommendations, attention strip,
   business health, today's operations, agent tiles, activity, deadlines.
2. Click **Review** on the #1 card ("Confirm equipment for tomorrow's
   install") — the evidence drawer opens, distinguishing source facts, agent
   inference, Cohen's recommendation, and the pending human decision.
3. **Approve** the proposed supplier follow-up draft (or **Reject** /
   **Ask Cohen** to request clarification).
4. The decision is recorded to the audit trail immediately — check
   **Activity** (`/activity`) to see it.
5. Click **Open linked record** on the same card (or navigate from
   **Operations**) to drill into the job at `/operations/job_2048` and see
   the same evidence from the operational side.

## Project layout

```
src/domain/            Typed entities + enums (v1) plus platform.ts / governance.ts /
                        memory.ts / events.ts (V2 additions — tenant, division,
                        agent registry, risk/trust, knowledge scope, decision/
                        outcome, event envelope, workflow types)
src/config/             Division registry, agent registry, workflow registry,
                        tenant business config (divisions.ts, agent-registry.ts,
                        workflows.ts, tenant.ts)
src/integrations/       Adapter contract + mock adapters (all read-only, no live writes)
src/approvals/          Approval state machine + prohibited-action guardrails —
                        the one gate every consequential action must pass
src/audit/              Append-only audit log
src/events/             Minimal event bus + event->workflow dispatch loop (routes,
                        does not execute, workflow steps)
src/cohen/              Ranking, conflict reconciliation, Ask Cohen, model-provider abstraction
src/data/               Seed dataset (+ sanitized external-dev variant) and in-memory
                        store (resets on restart — no real DB)
src/lib/tenant-context.ts   Tenant + module-entitlement lookup (V2 multi-tenant seam)
src/lib/validation.ts   zod request-body/query validation helpers (Phase 3A)
src/repositories/       Typed read/write access — the only thing API routes/UI touch
src/core/               The sanctioned Core/Dashboard boundary — src/app/** and
                        src/components/** may only reach Core through here
                        (enforced by an ESLint import-boundary rule, Phase 3A)
src/app/api/            Route handlers, incl. the V2 /api/kpis endpoint
src/app/                Pages: v1 screens + V2 /divisions, /work-queue,
                        /settings/governance, /settings/workflows, /agents/[id]
src/components/         Design system + feature components
tests/                  Vitest unit tests (79, across 12 suites)
db/migrations/          Production PostgreSQL schema (designed + verified against
                        real Postgres 16, not yet deployed — see DATABASE_DESIGN.md)
scripts/                Sandbox-only verification tooling (see BUILD_STATUS.md)
```

## Notes

- No banking/money-movement, deletion, legal-commitment, system-setting, or
  autonomous customer-send code path exists anywhere in this build — see
  `src/approvals/prohibited.ts` and the tests in `tests/approvals-engine.test.ts`.
- All external systems are mocked (`src/integrations/mock-adapters.ts`); none
  implement a write capability, so every approval simulates execution.
- `.env.example` documents the configuration surface for later real adapters
  — none of it is required to run the demo.
- A security review of this session's changes found no exploitable
  vulnerabilities in new code, and one real gap that's now fixed: the
  `POST /api/approvals/:id/{approve,reject,clarify}` routes previously
  performed no role check at all before deciding a proposal (`canUserApprove()`
  existed in `src/approvals/engine.ts` but was never called). All three
  routes now enforce it, matching the pattern already used by
  `/api/agents/:id/run` and `/api/kpis`. See `BUILD_STATUS_V2.md`
  Milestone 12 for the full review.

## Human-developer punch list (prioritized)

Ordered by what blocks a real production deployment first:

1. **Persistence — partially addressed, real database still needed.**
   `src/data/store.ts` now survives a single-process restart: it hydrates
   from (and periodically snapshots to) a local SQLite file via
   `src/data/persistence.ts`, using Node's built-in `node:sqlite` — no new
   dependency, gated off automatically during tests and `next build`.
   Verified live: mutated a proposal via the real API, killed the server
   process, confirmed a fresh restart, and the mutation was still there.
   **This is a stopgap, not the production answer** — it's a single local
   file, so it breaks on any multi-instance or serverless/edge deployment
   (each instance would have its own file with no shared source of truth),
   and it's a JSON blob snapshot, not a normalized schema. The database
   itself is no longer an open design question — `DATABASE_DESIGN.md`'s
   PostgreSQL schema (`db/migrations/`) is designed and verified against a
   real Postgres 16 instance, including Phase 3A's `integration_credentials`
   addition. What's still open is the actual swap of `store.ts`'s
   internals for real queries against it — `DATABASE_MIGRATION_HANDOFF.md`
   (Phase 3A) is the prepared package for that: a verified 19/19
   completeness audit, a repository-by-repository target-table map, and
   concrete acceptance criteria, so this is now "follow the map" rather
   than "design it from scratch."
2. **Real authentication/SSO.** `src/lib/auth.ts` is a single hardcoded
   demo session. Pick a session/auth provider, and when you add it, wire
   `hasAtLeastRole`/`canUserApprove` role checks through real per-request
   user identity — the check logic already exists and is now called from
   the approval routes; the “find the right user” side reads from
   `getCurrentUser()`, which is the one thing to actually replace.
3. **Multi-tenant storage.** `src/lib/tenant-context.ts` and
   `src/config/tenant.ts` are single-tenant-shaped on purpose (constant
   lookups keyed by a business id) so the swap to real tenant storage is a
   function-body change, not a call-site rewrite — but it hasn't been
   built yet.
4. **Real integration adapters.** `src/integrations/mock-adapters.ts` has
   the contract shape for all 15 target systems; none has live
   credentials or a write capability. Jobber first, per the original v1
   plan, is still the reasonable order.
5. **Marketing and Administration divisions.** Currently registry-only
   (`src/config/divisions.ts` `dataStatus: "mocked"`) — no specialist
   agent logic, no data source. Building these is comparable in scope to
   building a new division from scratch, not a config change.
6. **Event/workflow orchestration.** `src/events/dispatcher.ts` routes a
   published event to a matching workflow and logs the decision, but
   doesn't execute a workflow's steps. A live intake pipeline (so
   `lead.created`/`quote.accepted`/etc. are ever actually published) and a
   real step-executor are both still open.
7. **Accessibility audit.** Components use semantic HTML and the existing
   design system, but no formal WCAG 2.1 AA pass has been done.
8. **KPI history → forecasting.** `POST /api/kpis` now records real,
   as-displayed KPI snapshots (`src/repositories/kpi-observations.ts`), but
   there's no numeric normalization or trend/forecast model over that
   history yet — only a raw list.
