# AgentOS V2 Build Status

Maintained per `01_MASTER_SPEC.md` "Claude Build Manifest" and `CLAUDE.md`
"Implementation method". Updated after each milestone with what's
Completed / Mocked / Blocked External / Human Review Required.

---

## Milestone 0 — Repository audit (this entry)

### Current stack
Next.js 14.2 (App Router, TypeScript, strict mode) + React 18 + Tailwind
CSS 3. No database — `src/data/store.ts` is a single in-memory store
seeded once per process from `src/data/seed.ts`. No real auth —
`src/lib/auth.ts` returns one hard-coded demo `User` (`u_owner`). Tests run
under Vitest (`tests/*.test.ts`, jsdom environment). No ORM/migrations,
no queue, no external network calls anywhere in `src/` — every integration
in `src/integrations/mock-adapters.ts` is a typed mock with no live write
capability.

### Verified against the actual code (correcting/confirming `03_GAP_ANALYSIS.md`)
`03_GAP_ANALYSIS.md`'s baseline description is accurate. Specifics verified
by reading the source directly:
- `src/domain/entities.ts` + `enums.ts`: normalized, vendor-agnostic types
  for `User`, `Agent`, `Lead`, `Job`, `AccountingItem`, `SafetyRequirement`,
  `CustomerCase`, `VoiceCall`, `KnowledgeItem`, `Recommendation`,
  `ActionProposal`, `ApprovalDecision`, `AuditEvent`, `Notification`,
  `IntegrationSettings`. No `Tenant`, `Division`, `ModuleEntitlement`,
  `Workflow`, `Event`, `Task`, `KPIObservation`, `Decision`/`Outcome`,
  `AgentVersion` types existed before this milestone — confirms gaps A, B,
  E, G, H, I, K.
- `src/config/tenant.ts`: one hard-coded tenant (`vrhp`) with a single
  `salesResponseSlaMinutes` field; no `tenant_id` appears anywhere in
  `src/domain`, `src/repositories`, or `src/data/store.ts` — confirms gap A
  is real and total, not partial.
- `src/approvals/engine.ts` + `prohibited.ts`: a real, working approval
  state machine and prohibited-action guardrail. `resolvePostApprovalStatus`
  hard-codes `hasLiveWriteAdapter = false`, so every approved consequential
  proposal resolves to `approved_simulation` — the "never autonomous
  bank/payment movement" and "approval-first by default" non-negotiables
  are both already satisfied structurally, not just by policy text.
- `src/audit/log.ts`: append-only, no update/delete exported — matches the
  V2 audit requirement already.
- `src/cohen/orchestrate.ts`: ranks findings into a Top 3, reconciles
  conflicts; no event bus, no workflow registry, no correlation-id-based
  retry/idempotency layer — confirms gap G.
- `src/repositories/*`: one module per v1 screen area (`sales`,
  `operations`, `safety`, `accounting`, `customers`, `voice`, `agents`,
  `knowledge`, `integrations`, `activity`, `tracked`, `home`), all reading
  through `getStore()`. This is the layer the new `src/repositories/divisions.ts`
  (added this milestone) also goes through — no direct store access was
  added.
- `src/components/layout/nav-items.ts`: 12 flat top-level routes plus a
  2-item Settings section — confirms gap B (no Division/UDW concept existed
  before this milestone) and that Marketing/Administration/Executive
  Intelligence had no navigation entry point at all.
- No `/api/tenants`, `/api/divisions`, `/api/workflows`, `/api/events`,
  `/api/tasks`, `/api/kpis`, `/api/decisions`, `/api/modules` routes exist —
  confirms gap K.

### Install / build / typecheck / lint / test — now verified, not assumed
`BUILD_STATUS.md` (v1) is explicit that none of these had ever actually
been run — the original sandbox had no package-registry access. This
sandbox does. Results, first pass:

| Check | Result |
|---|---|
| `npm install` | ✅ 524 packages, no errors (10 pre-existing advisory-level vulnerabilities in transitive deps, not addressed — out of scope for this milestone) |
| `npm run typecheck` (`tsc --noEmit`, strict) | ✅ clean, no changes needed |
| `npm run test` (Vitest) | ✅ 33/33 tests passed across 6 suites, unmodified |
| `npm run lint` (`next lint`) | ❌ then ✅ — see below |
| `npm run build` (`next build`) | ❌ then ✅ — see below |

**Real bugs found and fixed** (pre-existing, from the never-executed v1
build — not new V2 work, but blocking a green baseline):
1. `.eslintrc.json` only extended `next/core-web-vitals` and declared a
   `@typescript-eslint/no-unused-vars` rule override, but never registered
   the `@typescript-eslint` plugin — `eslint-config-next`'s base config
   only wires that plugin's *parser*, not its *rules*, so every `.ts`/`.tsx`
   file failed lint with "Definition for rule ... was not found." Fixed by
   also extending `next/typescript` (which does `extends:
   ["plugin:@typescript-eslint/recommended"]`), plus setting
   `argsIgnorePattern: "^_"` so the codebase's existing
   intentionally-unused-parameter convention (`_since` in
   `mock-adapters.ts`) doesn't need to change.
2. `src/app/operations/[id]/page.tsx:57` — an un-escaped apostrophe
   (`Cohen's recommendation`) tripped `react/no-unescaped-entities`, a real
   lint error, not a false positive. Fixed with `&apos;`.
3. Two genuinely-unused imports (`depositsExpected` in
   `src/app/accounting/page.tsx`, `TRACKED_CATEGORY_LABELS` in
   `src/app/tracked/page.tsx`) — removed; both remain exported and used
   from their own repository modules.

After those fixes: `npm run lint` → "No ESLint warnings or errors";
`npm run build` → compiles, all 41 routes generated successfully (32 v1
routes + `/divisions` + `/divisions/[key]` × 8 static params, added this
milestone). Production server smoke-tested (`next start`) against
`/`, `/divisions`, `/divisions/sales`, `/divisions/marketing`,
`/divisions/executive_intelligence` — all HTTP 200, real (not placeholder)
computed values confirmed in the rendered HTML.

### Gaps, conflicts, unknowns (see `03_GAP_ANALYSIS.md` A–N for the full list — confirmed accurate)
No conflicts found between `03_GAP_ANALYSIS.md` and the actual code. One
addition: the gap analysis doesn't call out that **zero KPI history
exists** — there is no `KPIObservation`-shaped store anywhere, so "3-5 KPI
cards" can only ever show current-instant values, never trend/forecast,
until a persistence layer exists (relevant to gap M and Milestone 8).

### Milestone sequence adopted (matches `03_GAP_ANALYSIS.md` "Recommended migration sequence" and `01_MASTER_SPEC.md` "Claude Build Manifest")
0. ✅ Repository audit (this entry).
1. **Platform shell — Divisions IA** (this session, see below).
2. Core domain/mock data expansion: `Tenant`, `ModuleEntitlement`,
   `DivisionConfig` types landed this session (`src/domain/platform.ts`,
   `src/config/divisions.ts`, `src/lib/tenant-context.ts`) — still needed:
   `Agent`/`AgentVersion` V2 contract fields, `Task`, `Event`, `Workflow`,
   `KPIObservation`, `Decision`/`Outcome`, unified `Notification`.
3. Cohen Executive Dashboard upgrade (home page already has most of the
   raw data via `homeSnapshot()` — needs division-card aggregation).
4. Agent Registry V2 contract + versioning.
5. Work Queue + Notification/Approval Center unification.
6. Governance/progressive-trust framework (risk tiers, trust states).
7. Four-layer memory + decision/outcome model.
8. Event/workflow engine.
9. Integration adapter expansion (Marketing/Canva/ads mocks, capability/health model).
10. Valley River workflow configuration encoding/verification.
11. QA / tenant-isolation review / human-developer handoff.

### Destructive/architecture decisions requiring human approval — none taken; flagged for future milestones
- **Persistence**: still in-memory (`src/data/store.ts`). Swapping in a
  real database is explicitly a human-developer decision per
  `03_GAP_ANALYSIS.md` gap M and was not attempted.
- **Auth/SSO provider**: still a single demo session. Not attempted.
- No existing route, component, domain type, test, or seed record was
  deleted or renamed this milestone. All additions are new files plus
  three minimal, behavior-preserving bug fixes (lint config, one JSX
  entity escape, two unused imports) needed to get a real green build.

---

## Milestone 1 — Platform shell: Divisions information architecture ✅ (partial)

**Completed:**
- `src/domain/platform.ts`: `DivisionKey` (all 8 divisions), `ModuleEntitlement`,
  `Tenant`, `DivisionConfig` types. Additive — `src/domain/entities.ts`/`enums.ts` untouched.
- `src/config/divisions.ts`: the division registry — manager/specialist
  roster and named KPIs per division, copied verbatim from
  `01_MASTER_SPEC.md` "Divisions and agents". `dataStatus: "live" | "mocked"`
  per division (5 live: sales, operations, finance, safety,
  customer_experience, executive_intelligence; 2 mocked: marketing,
  administration — no code path fabricates data for the mocked ones).
- `src/lib/tenant-context.ts`: `getCurrentTenant()`, `getModuleEntitlements()`,
  `isModuleActive()`. Valley River (`vrhp`) receives all 8 divisions
  `active`/`flagship`, matching "Valley River: all required divisions
  enabled." Any other tenant id returns zero entitlements (no real
  multi-tenant storage exists yet — this is intentionally conservative,
  not a stub that silently grants access).
- `src/repositories/divisions.ts`: `divisionSnapshot(key)` — computes real
  KPI values from existing repository functions (`salesKpis`, `jobsAtRisk`,
  `listSafetyRequirements`, `listAccountingItems`, `listCustomerCases`,
  `listProposals`, `top3Recommendations`) for the 5 live divisions.
  Any named KPI this build has no data source for is `null` → rendered as
  "—", never a fabricated number. `recommendationsForDivision(key)` maps
  the existing `Recommendation.category` enum to divisions.
- **Universal Division Workspace**: one configuration-driven page,
  `src/app/divisions/[key]/page.tsx`, implementing all 7
  `01_MASTER_SPEC.md` UDW sections (Executive Summary/roster, KPI cards,
  Alerts & Exceptions, Active Work Queue, Forecasting/Trends,
  AI Recommendations, Audit & Learning) for all 8 divisions from one file —
  not eight duplicated pages (explicitly called out as a mistake to avoid
  in `03_GAP_ANALYSIS.md`). Plus `/divisions` index page (8 cards, Live/Mocked
  badge, work-queue count).
- Existing per-division v1 pages (`/sales`, `/operations`, `/safety`,
  `/accounting`, `/customers`) are **preserved untouched** and linked from
  the workspace ("Open full [division] view →") rather than replaced.
- Nav: added one `Divisions` entry to `PRIMARY_NAV`; all 12 existing nav
  entries and the mobile nav are unchanged.
- Marketing (mocked) surfaces the existing Sales-division competitor
  intelligence (`competitorSignals()`) as a clearly-labeled preview
  ("sourced from Sales... Marketing module not yet implemented") rather
  than inventing marketing-specific data.

**Mocked:**
- Marketing and Administration divisions: roster/KPI *labels* are real
  (from the spec), but no KPI *values*, alerts, or recommendations exist —
  by design, per "do not fabricate."
- 12 of the 40 named division KPIs across all 8 divisions have a real
  computed value; the rest render "—" because no underlying data exists
  yet (e.g. crew utilization, cash flow, customer satisfaction — none of
  these have a source field anywhere in the current domain model).

**Blocked External:** none introduced this milestone (no new integrations touched).

**Human Review Required:** none introduced this milestone.

---

## Milestone 3 — Cohen Executive Dashboard: division health ✅

**Completed:**
- `src/components/home/DivisionHealthGrid.tsx` + a new "Divisions" section
  on Home (`src/app/page.tsx`), between Top 3 and Nothing Left Behind —
  matches `01_MASTER_SPEC.md` "Cohen Executive Dashboard above the fold"
  ("division health cards using 3-5 KPI indicators"). Reuses
  `allDivisionSnapshots()` from Milestone 1 — no new data source, no
  duplicated computation.
- Each card shows up to 3 real KPI values (never placeholder numbers) and
  a work-queue-count badge; links to the full Universal Division Workspace.

**Mocked:** Marketing/Administration cards honestly show "Not yet
implemented" instead of a KPI, consistent with Milestone 1.

---

## Milestone 5 — Agent Registry V2 contract ✅

**Completed:**
- `src/domain/governance.ts`: `RiskTier` (0-4), `TrustState` (shadow /
  supervised / guarded_auto / trusted_auto), `AgentRegistryEntry` — the
  `01_MASTER_SPEC.md` "Standard Agent Contract" fields not carried by the
  v1 `Agent` entity. Kept as a separate keyed-by-`AgentId` overlay
  (`src/config/agent-registry.ts`) rather than changing `Agent` itself, so
  v1 seed data/tests are untouched.
- Every one of the 8 seeded agents got a real classification derived from
  what it actually does in this build (all have `systemsWrite: []` today —
  confirmed by reading `src/data/seed.ts` — so nothing is claimed above
  Tier 2, nothing is `trusted_auto`, and this is enforced by a new test,
  `tests/agent-registry.test.ts`).
- New individual Agent detail page, `src/app/agents/[id]/page.tsx` —
  identity/status/version, mission/manager (division link), risk
  tier + trust state with rationale, capabilities/permissions/events/KPI
  mappings/knowledge scopes/escalation target/accountable role, and
  execution history. `/agents` list page now links to it and shows a
  trust-state badge inline.

**Human Review Required:** the risk-tier/trust-state values above are a
reasonable first classification derived from existing code, not a
governance decision — Valley River's owner should review and confirm them
before any future milestone lets an agent auto-execute anything.

---

## Milestone 6 — Unified Work Queue ✅

**Completed:**
- `src/domain/platform.ts`: `WorkItem` type. `src/repositories/work-queue.ts`:
  `unifiedWorkQueue()` merges open Approval Centre proposals
  (`listProposals`) and "Nothing Left Behind" tracked items (`trackedItems`)
  into one division-filterable, priority-sorted list — a genuine merge, not
  a third parallel data source.
- New page `src/app/work-queue/page.tsx` — tabs for All + all 8 divisions,
  each item links back to its source page (`/approvals` or the item's own
  href). `/approvals` and `/tracked` are unchanged and still the deeper,
  type-specific views.
- Nav: added one "Work Queue" entry.

---

## Milestone 7 — Governance / progressive trust ✅ (policy view only)

**Completed:**
- `src/app/settings/governance/page.tsx`: risk-tier legend (0-4, with Tier 4
  explicitly marked "Blocked by default — no code path exists"), trust-state
  legend, a table of every agent's current classification (from Milestone
  5's registry), and promotion/demotion criteria as policy text.
- This page is read-only and changes no runtime behavior — confirmed by
  re-reading `src/approvals/engine.ts`, which is untouched. No trust state
  recorded anywhere lets any agent bypass approval on a consequential
  action (CLAUDE.md non-negotiable #6). `PROMOTION_CRITERIA` is spec text,
  not fabricated per-agent metrics — no agent has a real execution sample
  to report yet, so none is shown as promoted.

**Not yet started:** an actual promotion/demotion state machine that reads
real execution telemetry and changes an agent's trust state over time.
There is no execution-history data source substantial enough to drive one
yet (see Milestone 0's KPI-history gap).

---

## Milestone 8 — Decision/outcome memory ✅ (partial)

**Completed:**
- `src/domain/memory.ts`: four knowledge scope layers (global / company /
  division / executive), `KnowledgeClassification`, `Decision`, `Outcome`.
- `src/repositories/decisions.ts`: `listDecisions()` derives real `Decision`
  records from `ApprovalDecision` + `ActionProposal` data already in the
  store — not fabricated seed data. Every `Outcome` starts
  `pending_measurement`; no actual outcome or lesson is ever invented,
  because no outcome-tracking data source exists in this build yet
  (matches `01_MASTER_SPEC.md`: "Observed outcomes never silently rewrite
  policy").
- New "Decisions & outcomes" section on the Knowledge page.
- **Real bug fixed along the way**: `src/repositories/approvals.ts`'s four
  `decide*` functions destructured `{ proposal: decided }` from the
  approval engine and silently discarded the `ApprovalDecision` object the
  engine already returns — so no runtime decision was ever persisted to
  `store.approvalDecisions`, only seed-time ones. Fixed by persisting it
  (`persistDecision`), which is what makes the new Decisions section show
  more than pre-seeded history. Verified: all 41 tests still pass, and the
  Knowledge page renders real "Pending measurement" rows sourced from the
  seed's existing decisions after a fresh production build.

**Not yet started:** global/company/division/executive scope isn't
attached to the *existing* `KnowledgeItem` records yet (the types exist;
`KnowledgeItem` itself wasn't changed, to avoid touching v1 data); a real
outcome-measurement UI/flow.

---

## Milestone 9 — Event/workflow engine ✅ (registry + minimal bus, not a runtime orchestrator)

**Completed:**
- `src/domain/events.ts`: canonical `EventEnvelope` (matches the
  `01_MASTER_SPEC.md` "Event envelope example" exactly) and
  `WorkflowDefinition`/`WorkflowVersion` types.
- `src/events/bus.ts`: minimal in-memory `publishEvent`/`listEvents`.
  Wired into one real call site — every terminal approval decision
  (`src/repositories/approvals.ts`) now publishes a real `approval.resolved`
  event alongside the existing audit trail, rather than shipping an event
  bus nothing calls.
- `src/config/workflows.ts`: a registry of the 7 canonical workflows from
  `01_MASTER_SPEC.md` ("Canonical workflows"), each marked `active` (the
  described behavior is implemented today by existing v1 logic — cited
  inline) or `inactive` (marketing campaign factory, executive loop — no
  code implements these yet).

**Not yet started (explicitly, not hidden):** there is no dispatch loop
that routes a published event to a registered workflow handler — this is a
registry and a log, not yet an orchestrator. `lead.created`/
`quote.accepted`-style events also aren't published anywhere yet, because
this build has no live intake pipeline that would produce them (recommendations/
proposals are seeded, not generated at request time) — only
`approval.resolved` is real. Building the dispatch loop and wiring more
publish call sites is real future work, tracked here rather than implied
by the registry's existence.

---

## Milestone 10 — Integration adapter expansion ✅

**Completed:**
- `IntegrationId` (`src/domain/entities.ts`) extended with `sortly`,
  `google_drive`, `canva`, `meta_ads`, `google_ads` — the remaining
  `01_MASTER_SPEC.md` "Valley River adapter targets" not already present
  (Gmail was already covered by the existing `email` id). Purely additive;
  no exhaustive switch over `IntegrationId` exists anywhere in the
  codebase (checked), so nothing broke.
- Seed entries (`src/data/seed.ts`) and mock adapters
  (`src/integrations/mock-adapters.ts`) added for all 5, all
  `connected: false` / `health: "not_configured"`, each `healthMessage`
  explicitly stating BLOCKED_EXTERNAL and why. Canva's message notes it
  stays a draft/creative adapter, never a publishing bypass, even once
  connected.
- Settings → Integrations page needed no changes — it already renders
  `listIntegrations()` generically.

**Blocked External:** all 5 new integrations — no credentials or confirmed
vendor API capability exist for any of them.

---

## Milestone 12 — QA (partial: tenant isolation + agent registry tests) ✅

**Completed:**
- `tests/tenant-isolation.test.ts`: Valley River gets all 8 divisions
  active/flagship; an unrecognized tenant id gets zero entitlements (not a
  default grant); every division snapshot's KPI values are either a real
  string or explicitly `null` — never fabricated.
- `tests/agent-registry.test.ts`: every seeded agent has exactly one
  registry entry mapped to a real division; no agent is classified
  `trusted_auto` or risk tier 4.
- Full check suite green after every change in this session:
  `npm run typecheck` (strict), `npm run lint`, `npm run test` (41/41
  across 8 suites, up from 33/33), `npm run build` (51 routes, up from 41).
  Production server smoke-tested (`next start`) against every new route
  (`/work-queue`, `/agents/[id]`, `/settings/governance`, `/divisions/*`,
  `/knowledge`, `/settings/integrations`) — all HTTP 200 with real
  rendered data confirmed in the HTML, not just a successful build.

**Not yet started:** a full security review pass (secrets/injection/rate
limiting), an accessibility audit beyond what the existing components
already do, and the human-developer handoff punch list called for by
Milestone 12 in the spec — see "Remaining work" below.

---

## Remaining work (honest scope assessment)

Not attempted this session, and each large enough to warrant its own pass
rather than a shallow stub:
- **Milestone 2 (remainder)**: `Task` as a first-class persisted entity
  (today's Work Queue is a read-model projection, not a stored task list);
  `KPIObservation` history (nothing in this build can trend or forecast
  without one — flagged repeatedly above); attaching knowledge-scope layers
  to the actual `KnowledgeItem` records.
- **Milestone 4**: Marketing and Administration divisions remain data-free
  by design (Milestone 1) — building their real specialist logic (content
  drafting, SEO, document management, etc.) is substantial, agent-specific
  work, not a registry/config change.
- **Milestone 9 (remainder)**: the actual event→workflow dispatch loop.
- **Milestone 11**: the Valley River timing rules (lead SLA, quote timing,
  50% deposit, 3-business-day readiness, JSA cadence, 4 PM closeout, AP
  reminders, category priority order) are already implemented in v1 logic —
  verified by file:line reference in Milestone 0's audit — but nothing this
  session formally re-verified every one against the spec's exact wording
  end-to-end with new tests beyond what already existed.
- **Milestone 12 (remainder)**: a dedicated security-review pass, a WCAG
  2.1 AA accessibility audit, and the final prioritized human-developer
  punch list / architecture notes / schema-migration plan called for in
  `CLAUDE.md` "Final handoff" — persistence and auth are still explicitly
  out of scope pending a human infrastructure decision (03_GAP_ANALYSIS.md
  gap M).

---

## Historical (v1) build status
See `BUILD_STATUS.md` for the full v1 implementation record (Phases 0–5,
Agent Centre, Activity, Settings, Tests). It remains accurate as the
implementation baseline this V2 work builds on, except where superseded
above (in particular: "not yet executed against real npm/Node tooling" —
now executed and green).
