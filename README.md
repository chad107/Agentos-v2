# AgentOS v1 — Valley River Heat Pumps

Cohen, AI Operations Manager — an interactive, mock-data dashboard prototype
built from `AgentOS_Claude_Code_Build_Package/`. See `BUILD_STATUS.md` for
what's implemented, what's assumed, and what's still open.

## Quick start

This project was authored in a sandbox with no npm registry access, so it
has **not** been `npm install`ed or run yet — do that first, on a machine
with normal internet access:

```bash
npm install
npm run dev
```

Then open http://localhost:3000. No API credentials are required — the app
runs entirely on the seeded mock dataset (`src/data/seed.ts`, expanded from
`sample-data/agentos-demo-data.json`).

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
src/domain/          Typed entities + enums (07_DATA_MODEL.md)
src/integrations/    Adapter contract + mock adapters (06_INTEGRATIONS_AND_DATA_CONTRACTS.md)
src/approvals/        Approval state machine + prohibited-action guardrails (05_PERMISSIONS_AND_APPROVALS.md)
src/audit/            Append-only audit log
src/cohen/             Ranking, conflict reconciliation, Ask Cohen, model-provider abstraction
src/data/              Seed dataset + in-memory store
src/repositories/     Typed read/write access — the only thing API routes/UI touch
src/app/api/           Route handlers (08_API_AND_EVENT_SPEC.md)
src/app/               Pages (one per v1 screen, per CLAUDE.md)
src/components/        Design system + feature components
tests/                  Vitest unit tests
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
