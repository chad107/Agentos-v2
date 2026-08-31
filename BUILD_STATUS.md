# BUILD_STATUS.md — AgentOS v1 for Valley River Heat Pumps

Maintained per `PROMPT_TO_START_CLAUDE_CODE.md` #9. This file records what's
built, how it maps to the spec package, decisions made under ambiguity, and
what remains for a follow-on session.

## Architecture summary (written before scaffolding, per the prompt's instructions)

Next.js 14 (App Router) + TypeScript + Tailwind CSS, following
`02_SYSTEM_ARCHITECTURE.md`'s layering exactly:

```
domain/        typed entities + enums, no framework/vendor dependency
integrations/   IntegrationAdapter contract + capability interfaces (MessageSender,
                JobberWriter, QboBillWriter, PurchaseOrderWriter) + mock adapters
                that implement ONLY the read contract — no adapter in this build
                implements a write capability, by design
approvals/      permission-class guardrails + the approval state machine
audit/          append-only audit event log
cohen/          ranking, Top 3 selection, conflict reconciliation, Ask Cohen,
                ModelProvider abstraction (no vendor lock-in)
data/           seed dataset (expanded from sample-data/agentos-demo-data.json)
                + a single in-memory store standing in for a real database
repositories/   the only layer API routes/UI are allowed to import — wraps the
                store and enforces "approvals, recommendations, agent runs and
                audit entries are persisted separately"
app/api/        route handlers matching 08_API_AND_EVENT_SPEC.md
app/            one route per v1 screen (CLAUDE.md "v1 screens")
components/     design system primitives + feature components
```

Data flow mirrors `02_SYSTEM_ARCHITECTURE.md`'s "Recommendation pipeline":
seed findings → `cohen/orchestrate.ts` ranks and selects the Top 3 → each
recommendation may carry one or more `ActionProposal`s → a human decides via
`src/approvals/engine.ts` (which independently refuses anything prohibited,
at both creation and decision time) → every step writes to the audit log →
Home/Approvals/Activity all read the same store through `repositories/`.

Authority model implemented as **Level 2 — recommend / draft / propose /
request approval**. No code path exists for autonomous execution of a
consequential action; approving a `propose`/`execute_consequential`
proposal always resolves to `approved_simulation` because no adapter in
`src/integrations/mock-adapters.ts` implements a write capability
(`resolvePostApprovalStatus` in `src/approvals/engine.ts` hard-codes
`hasLiveWriteAdapter = false` for v1, with a comment pointing at Phase 6).

## ⚠️ Blocked: no package-registry access in the build sandbox

This is the most important entry in this file, so it's first.

The sandbox this was built in has an **egress allowlist that does not
include `registry.npmjs.org`** (or any CDN/mirror tried: jsdelivr, cdnjs,
unpkg, jsr.io, pypi.org — all returned 403 `host_not_allowed`, even though
some of those hosts appear in a `NO_PROXY` env var, which turned out not to
reflect the real firewall). `npx create-next-app` and `npm install` both
failed immediately. GitHub (`api.github.com`, `git clone`, `codeload`) *was*
reachable, but that doesn't help install a full Next.js/Tailwind toolchain.

**Consequence: this project has never had `npm install` run against it, and
`npm run dev` / `npm run build` / `npm run test` have never executed in this
sandbox.** Every file was hand-authored to be correct against Next.js 14 /
React 18 / Tailwind 3 / Vitest APIs from knowledge, not verified by actually
running those tools.

**What was done instead, to still ship with real confidence:**

1. Every `.ts`/`.tsx` file (111 of them) was passed through `esbuild`'s
   `transformSync` (vendored inside the globally-installed `tsx` package) as
   a syntax smoke test — see `scripts/syntax-check.js`. This catches typos,
   unbalanced JSX/braces, and invalid TS syntax, but **not** cross-file type
   errors or missing-import mistakes (no `@types/react`/`@types/node` were
   installable, so full `tsc` type-checking wasn't possible either).
2. `scripts/verify-logic.mjs` + `scripts/_verify-entry.ts` go further: they
   bundle the real `src/` modules with `esbuild` (resolving the `@/` path
   alias manually) and **actually execute** the core business logic —
   the approval state machine, the prohibited-action guardrails, Cohen's
   ranking/reconciliation, the JSA cadence function, and a full
   `getStore()`/`homeSnapshot()` load of the seed dataset — via Node's
   `assert`. All 16 checks passed at time of writing. This is not a
   replacement for the real Vitest suite in `tests/`, but it did catch and
   let me fix real bugs (see "Fixed during self-check" below) before
   delivery, rather than shipping unverified.
3. `tests/*.test.ts` is the real, complete Vitest suite — written to run
   with `npm run test` once dependencies are installed. It covers more
   ground than the sandbox script (component-adjacent repository logic,
   more edge cases) but has not itself been executed here.

**What you should do:** `npm install && npm run typecheck && npm run test &&
npm run dev` on a machine with normal registry access, before treating this
as done. I'd expect small type-level issues (an import path typo, a missing
prop) rather than logic errors, given the above — but I want to be honest
that "compiles cleanly" is not yet a claim I can back with a real compiler
run.

**Fixed during self-check:** an earlier draft of `src/data/seed.ts` computed
a "hours from now" helper inline instead of reusing `src/lib/dates.ts`'s
`hoursFromNow` — consolidated to avoid duplicate/divergent date logic before
it shipped.

## What's implemented

### Phase 0 — Repository and guardrails ✅
- Next.js/TypeScript scaffold, lint/typecheck/test scripts, `.env.example`
  (no secrets), domain types, repository interfaces, mock adapters, seed
  dataset, RBAC stub (`src/lib/auth.ts`, single demo session), audit
  framework.

### Phase 1 — Demonstrable command centre ✅
- Navigation (desktop sidebar + mobile bottom nav + settings section),
  design system (`src/components/ui`), Home with Top 3 / attention strip /
  business health / today's operations / agent tiles / activity / upcoming
  deadlines, recommendation evidence drawer (source fact / agent inference /
  Cohen recommendation / human decision, per `11_UI_COPY_AND_STATES.md`),
  Ask Cohen (deterministic demo chat, grounded in the open recommendation,
  no LLM credential required).

### Phase 2 — Approval-first loop ✅
- Approval Centre with all ten tabs from `03_DASHBOARD_UX_SPEC.md` (Needs
  me / Urgent / Safety / Financial / Customer / Operations / Draft messages
  / Orders–POs / Approved / Rejected), full state machine (`pending →
  approved → approved_simulation`, `pending → rejected`, `pending →
  clarification_requested → pending`), edit-before-approve for editable
  drafts, simulated execution, audit events on every transition, role
  gating stub.

### Phase 3 — Sales + Operations ✅
- Sales: KPIs, 10-stage pipeline board, lead cards (SLA-breach flagging is
  computed live off `Date.now()`, not hard-coded), competitor signal panel
  (sourced + dated + confidence-labeled).
- Operations: 8-column readiness board matching the exact stage vocabulary
  in `03_DASHBOARD_UX_SPEC.md`, job detail page (equipment from estimate,
  requirements, JSA, closeout evidence, recommended next action, and a
  callout linking back to Cohen's recommendation for that job).

### Phase 4 — Safety + Accounting ✅
- Safety: today's JSA cadence (missing → reminded at 4:00 PM → escalated at
  4:30 PM, computed live so the demo is correct at whatever time you load
  it), monthly ladder inspections.
- Accounting: vendor bills, bills due within 3 business days, deposits,
  final invoices awaiting handoff, statements needing cross-check,
  exceptions (duplicate-risk flagging included). No banking/payment code
  path exists.

### Phase 5 — Customer + Voice + Knowledge ✅
- Customers: intake queue grouped by the five spec categories; the seeded
  warranty case is explicitly `needs_technician_review`, never a diagnosis
  (AT-17).
- Voice: inbound KPIs, call list, an explicit guardrail note that outbound
  is consent-gated and no scraped/purchased-list campaign is ever presented
  as available (AT-16) — the Voice Agent is seeded `paused` per
  `12_OPEN_ITEMS.md` (business hours / transfer number / booking authority
  not yet defined).
- Knowledge: notes / extracted rules / proposed / approved / superseded
  SOPs, with pending items linking into the Approval Centre rather than a
  separate silent-approve path.

### Agent Centre, Activity, Settings ✅
- All 8 agents (Sales+Lead, Operations, Safety & Compliance, Accounting,
  Customer, Voice, Research/Marketing, Knowledge/SOP) with mission,
  read/write systems, schedules, last run, current task, open findings, and
  a role-gated "Run now" button wired to `POST /api/agents/:id/run`.
- Activity: filterable audit timeline (client-side, backed by
  `GET /api/activity`).
- Settings → Integrations: all 10 sources from `06_INTEGRATIONS_AND_DATA_CONTRACTS.md`
  with tier, health, capabilities, and a working "Test connection" button —
  no secret is ever rendered.
- Settings → Permissions: the day-one policy matrix and prohibited-action
  list rendered directly from `src/approvals/prohibited.ts` (the same
  constant the engine enforces), so this page can't drift from the code.

### Tests ✅
`tests/*.test.ts` (Vitest): prohibited-action creation/approval guardrails
(AT-03), approval-gating state transitions (AT-02), Top 3 selection and
safety-first ordering (AT-01), agent-conflict reconciliation (AT-11), lead
SLA breach detection (AT-05), operations readiness window (AT-07), JSA
cadence (AT-08), audit correlation (AT-14), naming guardrail scanning all of
`src/` for "Bob" (AT-15), voice consent guardrail (AT-16), and the
customer-case technician-review guardrail (AT-17). See the "blocked" section
above for how these were (and weren't yet) executed.

## Decisions made under ambiguity (per instruction #10 — preserve approval/traceability, don't invent policy)

- **Tech stack versions**: pinned to Next.js 14 + React 18 (rather than
  Next 15 + React 19, which the sandbox's *global* Node install happened to
  have) because that pairing is the more conservative, widely-documented
  App Router combination. `README.md` recommended "Claude Code may adjust
  package versions" — this is that adjustment, made for stability, not
  because of the network constraint.
- **Design system**: hand-rolled Tailwind primitives (`src/components/ui`)
  rather than installing shadcn/ui, since shadcn's CLI itself needs registry
  access to pull component source. The visual language (colors, spacing,
  radii) follows `CLAUDE.md`'s "Visual direction" section directly; nothing
  about the choice of shadcn vs. hand-rolled affects product behavior, and
  swapping in shadcn later is straightforward since the primitives share the
  same prop shapes (`Button`, `Card`, `Badge`, etc.).
- **Demo user / roster**: `12_OPEN_ITEMS.md` says the exact roster isn't
  supplied. The seed uses the names that *do* appear directly in the spec
  package — Al (install manager), Tanya (administrator), Aiden Brennan
  (staff) — plus a single signed-in "Chad" owner account (`src/lib/auth.ts`),
  since that's who commissioned this build. No email addresses or real
  credentials are invented.
- **Cohen's ranking tie-break**: the spec gives a category priority order
  (safety > financial > customer > operations > sales > admin) and says
  "urgent exceptions may interrupt," but doesn't fully specify how priority
  level and category combine. Implemented as: priority level first (urgent
  can jump ahead of a lower-priority safety item), then category, then
  soonest due date, then id (`src/cohen/orchestrate.ts`). This is a
  reasonable reading, not an invented business rule, and it's isolated to
  one function if Valley River wants a different tie-break later.
- **Approver role granularity**: `canUserApprove()` currently lets any
  approver-eligible role (owner/operator/administrator/install_manager) act
  on any approver-gated proposal, rather than enforcing exact role-to-
  proposal matching. Flagged in a code comment as an open item rather than
  guessing at Valley River's actual approval hierarchy.
- **"Today's operations" window**: shows jobs scheduled from the start of
  today through two calendar days out, as a simple stand-in for "today and
  next business day" — exact business-day/holiday handling wasn't
  specified and isn't invented here (`src/repositories/operations.ts`).
- **Seed narrative vs. sample-data.json**: `sample-data/agentos-demo-data.json`'s
  3 recommendations are all preserved, but a 4th high-priority Sales finding
  (a lead SLA breach) was added so the demo has AT-01's required ">3
  findings, exactly 3 shown" case *live*, without contradicting anything in
  the original sample data. The result: the seeded vendor-bill recommendation
  no longer makes today's Top 3 (it's outranked by two higher-priority sales
  items) — this is the ranking algorithm working as designed, not a bug; see
  the recommendation still fully present and visible in Accounting.

## Known gaps / next steps

- Not yet executed against real npm/Node tooling (see blocked section).
- No real authentication/SSO (Phase 7, explicitly future work).
- No real database — `src/data/store.ts` is in-memory per process; swapping
  in Postgres means replacing that one file's internals, since everything
  else already goes through `repositories/`.
- Real vendor adapters (Jobber first, per spec) are Phase 6 work; the
  adapter interfaces and capability separation are in place so that work is
  additive, not a rewrite.
- `next lint` config assumes `eslint-config-next` installs cleanly; not
  verified here for the same reason as above.
