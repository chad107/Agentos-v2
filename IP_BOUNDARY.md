# AgentOS — IP Boundary Classification

Part of the "Production Security, IP Protection & Commercialization Hardening"
phase. This document classifies every part of the repository so that
decisions about what to hand to outside application developers can be made
deliberately, not by accident. It does not rely on obscurity: assume any
developer given a file can read and understand it fully. Protection comes
from *not handing over* the restricted material, not from making it hard to
read.

Four buckets, per the phase brief:

- **SHAREABLE** — safe to give to a contracted/external dashboard developer.
- **RESTRICTED (AgentOS Core)** — proprietary reasoning, orchestration,
  governance, scoring, or business-rule logic. This is the product.
- **SECRETS / NEVER COMMIT** — must never exist in any repository, shared or
  not.
- **OWNER-ONLY BUSINESS CONFIG** — Valley River's specific business rules,
  seed narrative, and strategic documents. Not a security boundary in the
  technical sense, but not appropriate to hand to a generic external
  developer either.

## Headline finding

**The current codebase is one Next.js application. Server Components and
API routes both import `src/repositories/*` directly, in-process — there is
no network or process boundary between "Dashboard" and "Core" today.**
Handing this repository to an external developer as-is, even if you only
ask them to touch `src/app` and `src/components`, gives them read access to
every file they can `import` from — which today is everything. This is the
central problem this hardening phase exists to fix. The classification
below is the map; `PRODUCTION_ARCHITECTURE.md` and `HUMAN_DEVELOPER_HANDOFF.md`
describe the concrete repository-split strategy that actually enforces it.

---

## RESTRICTED — AgentOS Core

Everything here is the proprietary reasoning, governance, and business-rule
layer named explicitly in the phase brief. This is what makes AgentOS worth
licensing rather than rebuilding.

| Path | What it is | Why it's Core |
|---|---|---|
| `src/cohen/` | Ranking, conflict reconciliation, Ask Cohen, model-provider abstraction | The product's namesake reasoning layer |
| `src/approvals/engine.ts`, `prohibited.ts`, `stages.ts` | Approval state machine, prohibited-action guardrail, stage vocabulary | The safety/trust mechanism the whole product is built around |
| `src/audit/log.ts` | Append-only audit invariants | Governance/compliance primitive |
| `src/events/bus.ts`, `dispatcher.ts` | Event publication + workflow routing | Orchestration engine |
| `src/domain/governance.ts` | Risk tiers, trust states, promotion/demotion criteria, agent contract shape | Proprietary governance model and policy text |
| `src/domain/memory.ts` | Knowledge scope layers, Decision/Outcome model | Institutional-memory design |
| `src/domain/events.ts` | Canonical event/workflow envelope | Orchestration contract |
| `src/config/workflows.ts` | The 7 canonical workflow definitions | Encoded business-process IP |
| `src/config/agent-registry.ts` | Per-agent risk/trust classification, rationale, KPI mapping | Proprietary scoring |
| `src/config/divisions.ts` | Division roster, manager/specialist structure, named KPIs | The product's operating model |
| `src/repositories/*` (all 20 files) | Every KPI formula, SLA-breach calculation, readiness-window rule, work-queue merge algorithm, decision derivation | This is where "AgentOS decides what matters" actually happens — the single highest-value directory in the repo |
| `src/data/store.ts`, `persistence.ts` | In-memory store + durability engine | Core runtime, not UI |
| `src/lib/auth.ts` | Authorization entry point (`getCurrentUser`, `hasAtLeastRole`) | Security-critical even though today's implementation is a demo stub |
| `src/lib/tenant-context.ts` | Tenant + module-entitlement resolution | **This is the licensing/paywall enforcement point** — must never be editable or even fully visible to a licensee's own developers |
| `src/lib/jsa-cadence.ts` | Safety cadence algorithm | Small file, real proprietary business rule |
| `src/integrations/types.ts`, `mock-adapters.ts` | Adapter contracts | Today these are mocks (see `INTEGRATION_SECURITY.md`); once real, the vendor-specific auth/request logic that replaces the mocks is highly sensitive and belongs here, not in a shared repo |

**Tests that assert on Core behavior** (these encode the exact business
rules as executable specifications — reading them is nearly as revealing as
reading the implementation): `tests/approvals-engine.test.ts`,
`tests/cohen-orchestrate.test.ts`, `tests/agent-registry.test.ts`,
`tests/event-dispatch.test.ts`, `tests/safety-jsa-cadence.test.ts`,
`tests/sales-sla.test.ts`, `tests/operations-readiness.test.ts`,
`tests/audit-and-guardrails.test.ts`, `tests/tenant-isolation.test.ts`.
Classify with the code they test — restricted.

---

## SHAREABLE with application developers

| Path | What it is | Notes |
|---|---|---|
| `src/app/**/page.tsx`, `not-found.tsx`, `layout.tsx` | Page components | Presentation only |
| `src/components/**` | Design system + feature components | Pure UI; no business logic |
| `src/domain/entities.ts`, `enums.ts`, `index.ts` | v1 type contracts | A frontend needs these shapes to type its props; they describe *shape*, not policy |
| `src/domain/platform.ts` | V2 type shapes (`DivisionKey`, `WorkItem`, `KPIObservation`, etc.) | Shapes only — the *values*/policy live in `src/config/*`, which stays Core |
| `src/lib/api.ts`, `cn.ts`, `dates.ts`, `ids.ts` | Generic utilities | No business logic |
| `src/types/node-sqlite.d.ts` | Ambient types | Irrelevant to a dashboard developer but harmless |
| `.env.example` | Config surface template, no values | Already secret-free |
| `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `package.json` | Build tooling | Standard, no IP |
| `public/` | Static assets | — |

**`src/app/api/**/route.ts` — shareable as a *contract*, not as source to
copy.** Today these files are thin wrappers that call straight into
`src/repositories/*` (Core). A dashboard developer needs to know each
route's request/response shape (documented in `API_CONTRACT.md`) but should
not need the route source itself once a real Core/Dashboard split exists —
in the target architecture these routes live inside Core's deployment, and
the Dashboard only ever sees the HTTP contract.

---

## OWNER-ONLY BUSINESS CONFIGURATION

Not a security vulnerability if leaked, but not appropriate to hand to a
generic outside developer either — this is Valley River's specific
business identity and strategy, not the reusable platform.

| Path | What it is |
|---|---|
| `01_MASTER_SPEC.md`, `00_READ_ME_FIRST.md`, `03_GAP_ANALYSIS.md` | The full V2 product/architecture specification |
| `CLAUDE.md`, `PROMPT_TO_START_CLAUDE_CODE.md` | Internal build instructions |
| `BUILD_STATUS.md`, `BUILD_STATUS_V2.md` | Full build history, including every gap and internal decision |
| `src/config/tenant.ts` | Valley River's actual SLA minutes and business config |
| `src/data/seed.ts`, `sample-data/agentos-demo-data.json` | Valley River's seeded business narrative (customer names, job data, dollar amounts) — fictional/demo, but styled as real operating data and not meant for redistribution |
| This document, `IP_BOUNDARY.md`, and the other 10 new hardening docs | Strategy documents about the IP itself |

**Recommendation:** a sanitized, generic (non-Valley-River-branded) seed
dataset should be created for anything handed to an external developer for
local development — see `HUMAN_DEVELOPER_HANDOFF.md`.

---

## SECRETS / NEVER COMMIT

Nothing in this category currently exists in the repository — verified by
grep across `src/` for `key|secret|password|token|bearer` patterns (Milestone
12 security review) and manual review of `.env.example` (placeholders only,
no values). This bucket exists to state policy going forward, since the
"Blocked External" integrations in `INTEGRATION_SECURITY.md` will introduce
real credentials the moment any of them is connected:

- Any populated `.env` / `.env.local` file (real values, not the template).
- Vendor API keys, OAuth client secrets, refresh/access tokens for Jobber,
  QuickBooks Online, CompanyCam, Google (Calendar/Drive/Gmail), RingCentral,
  Sortly, Canva, Meta Ads, Google Ads — once any of these move past mock.
- Database connection strings/credentials for the real production database.
- Session-signing secrets, JWT signing keys, or any auth-provider secret.
- `.data/*.sqlite` — the local persistence snapshot. It is `.gitignore`d
  already, and once real (non-demo) tenant data ever lands in it, it must
  never be attached to an issue, emailed, or handed to a developer for
  "debugging" without being treated as production data.
- Any future secret-manager export, backup dump, or production log
  containing customer PII.

**Enforcement recommendation:** add a pre-commit or CI secret-scanning step
(e.g., gitleaks or truffleHog) before this repository — or any split
descendant of it — is ever made available outside the owner's direct
control. Not yet implemented; see `PRODUCTION_READINESS_CHECKLIST.md`.

---

## What this means in practice

See `HUMAN_DEVELOPER_HANDOFF.md` for exactly what to hand a contracted
developer today (given the current single-repo architecture) versus after
the recommended repository split is carried out, and `PRODUCTION_ARCHITECTURE.md`
§"Core/Dashboard Separation" for the concrete migration path.
