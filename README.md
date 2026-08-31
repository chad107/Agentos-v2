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
`npm run test` (45/45), and `npm run build` (52 routes) all pass cleanly —
see `BUILD_STATUS_V2.md` Milestone 0/12 for the exact commands run and
issues fixed along the way.

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # vitest run — approval gating, prohibited actions, AT-0x checks
npm run build        # production build
```

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
src/data/               Seed dataset + in-memory store (resets on restart — no real DB)
src/lib/tenant-context.ts   Tenant + module-entitlement lookup (V2 multi-tenant seam)
src/repositories/       Typed read/write access — the only thing API routes/UI touch
src/app/api/            Route handlers, incl. the V2 /api/kpis endpoint
src/app/                Pages: v1 screens + V2 /divisions, /work-queue,
                        /settings/governance, /settings/workflows, /agents/[id]
src/components/         Design system + feature components
tests/                  Vitest unit tests (45, across 9 suites)
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

1. **Persistence.** `src/data/store.ts` is in-memory and resets on every
   process restart — nothing here survives a deploy. Pick a database
   (03_GAP_ANALYSIS.md gap M), design the schema/migrations from the
   `src/domain/` types (they're already normalized and DB-shaped), and
   replace `store.ts`'s internals. Every other layer already goes through
   `src/repositories/`, so this should be a contained swap.
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
