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

**Update — dispatch loop added:** `src/events/dispatcher.ts`'s
`dispatchEvent()` now runs on every `publishEvent()` call: it finds every
`active`, event-triggered workflow whose `triggerEventType` matches, and
records a `workflow.routed` audit entry for each match — a real routing
decision, not a fabricated one. The Executive loop workflow was re-pointed
to trigger on `approval.resolved` (`triggerType: "event"`, `status:
"active"`) because its "decision/outcome record" step genuinely is
implemented (Milestone 8's `src/repositories/decisions.ts`) — its
Monitor/Analyze/Recommend/forecast/proposed-learning steps are not, and the
workflow's own description says so explicitly. Verified end-to-end:
`tests/event-dispatch.test.ts`, plus a live smoke test — `POST
/api/approvals/:id/reject` on a running production build produced a real
`workflow.routed` entry visible on `/settings/workflows`.

New page: `/settings/workflows` — every registered workflow (status,
trigger, owner division, description) plus the last 20 real routing
decisions from the audit trail.

**Milestone 2 gap partially closed — KPI observation history:**
`src/domain/platform.ts` `KPIObservation` + `src/repositories/kpi-observations.ts`
+ `POST`/`GET /api/kpis` (the suggested API endpoint from `01_MASTER_SPEC.md`
that didn't exist before). Recording is an explicit action, not a page-render
side effect: `POST /api/kpis` snapshots every division's current, real KPI
values (never a normalized/fabricated number — recorded exactly as
displayed). The Universal Division Workspace's "Forecasting & trends"
section now shows recorded observations when any exist, replacing the
empty state. Verified live: a `POST` on a running build produced real
snapshot rows that immediately rendered on `/divisions/sales`. Still not a
forecast — it is observed history only, and there's no chart/trend-line
UI yet, by design (small, honest step rather than a fabricated projection).

**Still not started:** `lead.created`/`quote.accepted`-style events aren't
published anywhere, because this build has no live intake pipeline that
would produce them (recommendations/proposals are seeded, not generated at
request time) — only `approval.resolved` is real. The dispatcher also only
*routes* (records which workflow subscribes) — it does not execute a
workflow's steps; doing that for real would mean building orchestration
logic specific to each of the 7 canonical workflows, out of scope here.

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

## Milestone 11 — Valley River workflow configuration: verified against spec text ✅ (one correction made)

Every Valley River-specific rule in `01_MASTER_SPEC.md` "Divisions and
agents" checked against the actual running code, file:line cited:

| Rule (01_MASTER_SPEC.md wording) | Status | Evidence |
|---|---|---|
| Lead response ≤60 min (business-day) | **Fixed this milestone** | Was 120 min (`src/config/tenant.ts`) — a generic platform default, not a VRHP-specific one. Corrected to 60 after confirming with the user, since it reflows seeded lead timestamps/copy text. `src/data/seed.ts:42-43` already derives `SALES_SLA_MINUTES`/`SALES_SLA_HOURS` live from `getTenantConfig()`, and interpolates it into finding/recommendation copy (`seed.ts:265,266,344,1089`) — so the correction reflowed automatically with no seed data hand-edited. All 43 tests still pass; `tests/sales-sla.test.ts` updated to assert 60. |
| Quotes normally ≤24h, max 48h | **Narrative only, not enforced** | `Lead.quoteSentAt`/`createdAt` exist and the new Sales division KPI (`src/repositories/divisions.ts` `salesSnapshot`) computes a real median quote-turnaround from them, but nothing flags or blocks a quote past 24/48h — no live quoting pipeline exists to enforce it against (seed data is static). |
| Jobber auto follow-up after 2 days; manual day 3-4 | **Narrative only, not enforced** | `LeadStage` includes `"follow_up"` (`src/domain/entities.ts`) and seeded leads use it, but there's no computed day-count trigger — same root cause as above (no live pipeline). |
| Accepted quote + ~50% deposit drives readiness | **Descriptive, not computed** | `Job.readinessStatus`/`readinessScore` are set directly in seed data (`src/data/seed.ts`), not derived from a live deposit-amount check. One knowledge note (`seed.ts:1026`) references the 50% figure narratively. No deposit-percentage field exists on any entity to compute against. |
| Equipment/materials verified ≥3 business days before job | **Implemented** | `isWithinReadinessWindow()`, `src/repositories/operations.ts:29-32`, uses `businessDaysFromNow(3, reference)` — exact match. |
| 4:00 PM CompanyCam closeout check | **Implemented** | Agent schedule string `"closeout_check (weekday 16:00)"`, `src/data/seed.ts:128`; Operations division's closeout tracking (`jobsWithMissingCloseout()`) reads the resulting `readinessStatus`. |
| Daily JSA: Mon-Fri, primary Al / designee Aiden Brennan, 4:00 PM reminder, 4:30 PM escalation to Cohen | **Implemented** | `jsaCadenceStatus()`, `src/lib/jsa-cadence.ts` — pure function, reminder/escalation timestamps compared exactly; `tests/safety-jsa-cadence.test.ts` covers it. Al/Aiden Brennan are the seeded assignees (`src/data/seed.ts`). |
| Monthly ladder inspection reminder | **Implemented** | `ladderInspections()`, `src/repositories/safety.ts`; agent schedule `"ladder_inspection_monitor (monthly)"`. |
| AP due-soon reminder ~3 business days prior | **Implemented** | `billsDueSoon()`, `src/repositories/accounting.ts:8-13`, uses the same `businessDaysFromNow(3, reference)` helper. |
| Never initiate bank payment | **Implemented (structurally, not just by policy)** | No `PaymentSender`/bank-write capability interface exists anywhere in `src/integrations/types.ts`; `resolvePostApprovalStatus()` (`src/approvals/engine.ts`) hard-codes `hasLiveWriteAdapter = false`, so no consequential proposal — including any accounting one — can ever auto-execute. |
| Priority: Safety > Financial > Customer; urgent interrupts | **Implemented** | `CATEGORY_PRIORITY_ORDER`, `src/domain/enums.ts:20-27`, exact order; Cohen's tie-break (`src/cohen/orchestrate.ts`) ranks urgency before category, matching "urgent exceptions may interrupt." `tests/cohen-orchestrate.test.ts` covers ranking. |
| 4:30 PM executive recap | **Not implemented** | No code, page, or scheduled artifact produces an executive recap at any time. Genuine gap — not fabricated as present. |
| Full flagship entitlements for Valley River | **Implemented (Milestone 1)** | `getModuleEntitlements("vrhp")` returns all 8 divisions `active`/`flagship`; enforced by `tests/tenant-isolation.test.ts`. |

**Human Review Required:** the lead-SLA correction above is a real business
rule change now live in this build (60 min, not 120) — confirmed with the
user before merging, but worth Valley River's owner independently
double-checking against how they actually operate before this goes to
production, since 03_GAP_ANALYSIS.md gap M means there is no real
persistence/audit trail yet.

---

## Milestone 12 — QA (tenant isolation + agent registry tests, security review, handoff punch list) ✅

**Completed:**
- `tests/tenant-isolation.test.ts`: Valley River gets all 8 divisions
  active/flagship; an unrecognized tenant id gets zero entitlements (not a
  default grant); every division snapshot's KPI values are either a real
  string or explicitly `null` — never fabricated.
- `tests/agent-registry.test.ts`: every seeded agent has exactly one
  registry entry mapped to a real division; no agent is classified
  `trusted_auto` or risk tier 4.
- `tests/event-dispatch.test.ts`: a real `approval.resolved` event routes to
  the Executive loop workflow and is recorded in the audit trail.
- **Security review** (subagent-driven, covering all 21 API routes, the
  approval engine, event bus/dispatcher, tenant context, and a repo-wide
  scan for dangerous sinks/secrets): no exploitable vulnerability found in
  any code added this session — no injection sinks, no XSS (no
  `dangerouslySetInnerHTML` anywhere), no hardcoded secrets, no tenant
  fallback that grants unrecognized-tenant access, no way for the event
  bus/dispatcher/KPI-observation code to construct or bypass-approve a
  consequential action.
  One real, concrete gap **found and fixed**: `canUserApprove()`
  (`src/approvals/engine.ts`) existed but was never called anywhere —
  `POST /api/approvals/:id/{approve,reject,clarify}` performed no role
  check at all before deciding a proposal, unlike `/api/agents/:id/run`
  and the new `/api/kpis`, which both correctly gate on `hasAtLeastRole`.
  Currently inert in this build (`getCurrentUser()` is hardcoded to a
  single owner-role demo session, so there's no reachable path to exploit
  it today) but a real latent gap for whenever real per-request auth is
  added. Fixed: all three routes now fetch the proposal and call
  `canUserApprove(user.role, proposal.approverRole)`, returning 403
  otherwise — matching the sibling routes' pattern exactly. Covered by two
  new unit tests in `tests/approvals-engine.test.ts`; smoke-tested live
  (`POST /api/approvals/:id/approve` on a running build still succeeds for
  the demo owner user, confirming the gate doesn't break the legitimate
  path).
- **Human-developer handoff punch list**: added to `README.md`
  ("Human-developer punch list (prioritized)") — persistence, real
  auth/SSO, multi-tenant storage, real integration adapters, Marketing/
  Administration division build-out, event/workflow orchestration,
  accessibility audit, KPI forecasting, in priority order with the exact
  files each one touches.
- Full check suite green after every change in this session:
  `npm run typecheck` (strict), `npm run lint`, `npm run test` (45/45
  across 9 suites, up from 33/33), `npm run build` (52 routes, up from 41).
  Production server smoke-tested (`next start`) against every new route,
  including exercising real POST actions (`/api/approvals/:id/{approve,reject}`,
  `/api/kpis`) and confirming their effects render live on
  `/settings/workflows` and the division Forecasting section — all HTTP 200
  with real rendered/computed data, not just a successful build.

**Not yet started:** a formal WCAG 2.1 AA accessibility audit (components
use semantic HTML and the existing design system throughout, but no
dedicated pass has been done); dependency-vulnerability triage (`npm
audit` reported 10 pre-existing advisories in transitive dev dependencies
at Milestone 0, not investigated further — out of scope for an
application-code security review).

---

## Post-milestone-12 — local persistence (03_GAP_ANALYSIS.md gap M, partial) ✅

Picked up after the initial 12-milestone pass, at the user's direction, as
the highest-priority item on the human-developer punch list: "nothing here
survives a deploy."

**Completed:**
- `src/data/persistence.ts`: `loadSnapshot()`/`saveSnapshot()` backed by
  Node's built-in `node:sqlite` (`DatabaseSync`) — no new npm dependency.
  One table, one row: the entire `Store` (`src/data/store.ts`) serialized
  as JSON. Every field in `Store` is already plain JSON-safe data
  (timestamps are ISO strings, not `Date` objects), so this round-trips
  exactly with no revival logic.
- `src/data/store.ts`: `getStore()` now hydrates from a disk snapshot on
  first call if one exists, else builds fresh from seed (unchanged
  behavior) and writes the first snapshot. A 5-second periodic flush plus
  a flush on `beforeExit`/`SIGINT`/`SIGTERM` means a hard restart loses at
  most ~5 seconds of writes, not everything.
- **Correctly gated off** in the two places it would otherwise cause real
  damage: `persistenceEnabled()` returns `false` whenever `process.env.VITEST`
  is set (tests need a deterministic fresh-seeded store every run — verified
  no `.data/` directory appears after `npm run test`) and whenever
  `process.env.NEXT_PHASE === "phase-production-build"` (so `next build`'s
  static generation — which does call `getStore()` for the SSG division
  pages and static API routes — never touches disk; verified no `.data/`
  directory appears after a clean `npm run build`).
- Degrades gracefully, not a hard crash, if `node:sqlite` is unavailable
  (older Node): `getDb()` is wrapped in try/catch and falls back to
  in-memory-only behavior with a console warning — the existing behavior
  from before this change.
- `src/types/node-sqlite.d.ts`: a minimal hand-written ambient module
  declaration, since the installed `@types/node` (^20.x) predates this
  Node 22.5+ built-in and has no type declarations for it.
- `tests/persistence.test.ts`: verifies the save/load round-trip against a
  real temporary SQLite file, and that `persistenceEnabled()` correctly
  reports `false` during a normal test run.
- **Verified live, not just by code review**: started a production build
  (`next start`), rejected a real proposal through the actual
  `POST /api/approvals/:id/reject` route, confirmed the snapshot file grew
  after the 5-second flush, killed the server process (`kill -9`, confirmed
  zero `next-server` processes remained), started a completely fresh
  instance, and confirmed the rejected proposal was still `rejected` (not
  reset to `pending`) — proof this is real durability, not a no-op.

**Explicitly NOT claimed — read before deploying:**
- This is **not** the production database decision from
  `03_GAP_ANALYSIS.md` gap M, which remains Human Review Required. It's a
  single local file: it will silently misbehave (each instance seeing a
  different, diverging snapshot) on any multi-instance or serverless/edge
  deployment. It is only correct for a single, self-hosted, long-running
  process.
- It's a JSON blob snapshot, not a normalized relational schema — no
  indexes, no queries, no migrations, no partial writes. Picking a real
  database and designing that schema from the already-normalized
  `src/domain/` types is still open work.
- `node:sqlite` is an experimental Node API (logs an
  `ExperimentalWarning`, harmless but worth knowing about) and requires
  Node ≥22.5 — the app's declared `engines.node` (`>=18.18.0`) is
  unchanged and still accurate, since persistence degrades gracefully to
  the prior in-memory-only behavior on older Node rather than requiring
  the bump.

Full check suite green: `npm run typecheck` (strict), `npm run lint`,
`npm run test` (47/47 across 10 suites, up from 45/45), `npm run build`
(52 routes, unchanged — this was a `src/data/` layer change, not a new
route).

---

## Remaining work (honest scope assessment)

Not attempted this session, and each large enough to warrant its own pass
rather than a shallow stub:
- **Milestone 2 (remainder)**: `Task` as a first-class persisted entity —
  today's Work Queue (Milestone 6) is a read-model projection over
  approvals + tracked items, not a stored task list an agent could create
  ad hoc; attaching knowledge-scope layers to the actual `KnowledgeItem`
  records (the scope *types* exist, `KnowledgeItem` itself is unchanged).
  `KPIObservation` history now exists (see Milestone 9 update above) but
  only as raw observed values — no numeric normalization or charting.
- **Milestone 4**: Marketing and Administration divisions remain data-free
  by design (Milestone 1) — building their real specialist logic (content
  drafting, SEO, document management, etc.) is substantial, agent-specific
  work, not a registry/config change.
- **Milestone 9 (remainder)**: no live event producers for
  `lead.created`/`quote.accepted`-style events (no live intake pipeline
  exists); the dispatcher routes but doesn't execute a workflow's steps.
- **Milestone 12 (remainder)**: a formal WCAG 2.1 AA accessibility audit,
  and dependency-vulnerability triage of the 10 pre-existing `npm audit`
  advisories.
- **Gap M (partial)**: single-process local persistence now exists (see
  "Post-milestone-12" above) — but the real production database decision,
  schema, and migrations remain open, and real auth/SSO is still
  untouched. The punch list for both is in `README.md`.

---

## Historical (v1) build status
See `BUILD_STATUS.md` for the full v1 implementation record (Phases 0–5,
Agent Centre, Activity, Settings, Tests). It remains accurate as the
implementation baseline this V2 work builds on, except where superseded
above (in particular: "not yet executed against real npm/Node tooling" —
now executed and green).
