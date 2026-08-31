# AgentOS — API Contract

The seam between AgentOS Core and the Dashboard (`PRODUCTION_ARCHITECTURE.md`
§2, §5). This is the current, real inventory of every existing route —
verified by reading `src/app/api/**/route.ts` directly, not inferred — plus
the request/response conventions new routes should follow. A Dashboard
developer building against Core should need this document and
`src/domain/entities.ts` + `src/domain/platform.ts` (type shapes only —
`IP_BOUNDARY.md`), and nothing else.

## Conventions

- All responses are JSON, produced via `src/lib/api.ts`'s helpers:
  `ok(data, status?)` (200 default), `badRequest(message)` (400),
  `notFound(message)` (404), `forbidden(message)` (403). Error responses
  are always shaped `{ "error": "<message>" }`.
- No route currently versions its URL (`/api/v1/...`) — recommended before
  the first external Dashboard consumer, since Core will evolve
  independently of any given Dashboard build once the repository split
  happens (`PRODUCTION_ARCHITECTURE.md` §2).
- No route currently requires an `Authorization` header — there is one
  hardcoded demo user (`AUTHORIZATION_MODEL.md`). Every route below will
  need a bearer-token or session-cookie check added once real auth exists;
  the ones marked "role-gated" already call `hasAtLeastRole()`/
  `canUserApprove()` against the (currently fixed) current user, and are
  the routes to prioritize when wiring in real per-request identity.

## Route inventory

| Route | Method | Role-gated? | Purpose |
|---|---|---|---|
| `/api/home` | GET | No | Cohen's executive dashboard snapshot (`homeSnapshot()`) |
| `/api/activity` | GET | No | Audit trail, filterable by `actorType`/`entityType`/`limit` query params |
| `/api/agents` | GET | No | List all agents |
| `/api/agents/:id/run` | POST | **Yes** — `administrator`+ | Trigger a demo agent run (records an audit event; no live agent process exists to actually invoke) |
| `/api/approvals` | GET | No | List action proposals |
| `/api/approvals/:id/approve` | POST | **Yes** — `canUserApprove()` (added this phase, see below) | Approve a proposal, optional `editedPayload` body for edit-before-approve |
| `/api/approvals/:id/reject` | POST | **Yes** — `canUserApprove()` (added this phase) | Reject a proposal; requires `{ "reason": string }` |
| `/api/approvals/:id/clarify` | POST | **Yes** — `canUserApprove()` (added this phase) | Request clarification; optional `{ "question": string }` |
| `/api/cohen/chat` | POST | No | Deterministic "Ask Cohen" demo Q&A; requires `{ "question": string }`, optional `recommendationId` |
| `/api/customers/cases` | GET | No | List customer cases |
| `/api/integrations` | GET | No | List integration settings (mocked adapters, never real credentials) |
| `/api/integrations/:id/test` | POST | No | Simulated "Test connection" — never contacts a real vendor |
| `/api/knowledge` | GET | No | List knowledge items |
| `/api/kpis` | GET | No | List recorded KPI observations, filterable by `division`/`limit` query params |
| `/api/kpis` | POST | **Yes** — `administrator`+ | Record a snapshot of every division's current KPI values |
| `/api/operations/jobs` | GET | No | List jobs |
| `/api/operations/jobs/:id` | GET | No | Job detail |
| `/api/recommendations` | GET | No | List recommendations |
| `/api/recommendations/:id` | GET | No | Recommendation detail |
| `/api/safety` | GET | No | Safety requirements (JSA/inspections) |
| `/api/sales/leads` | GET | No | List leads |
| `/api/voice/calls` | GET | No | List voice calls |

**Note on the `canUserApprove()` fix:** the Milestone 12 security review
(`BUILD_STATUS_V2.md`) found these three approval-decision routes had *no*
role check at all before this phase's predecessor session fixed it — they
are now the routes to treat as the reference pattern for "role-gated write
route," alongside `/api/agents/:id/run` and `/api/kpis` POST.

## What's missing from this contract (by design, not omission)

There are no `/api/tenants`, `/api/divisions`, `/api/workflows`, `/api/events`,
`/api/tasks`, `/api/decisions`, `/api/modules` routes — the data they'd
serve is read today via Server Components importing repository functions
directly (e.g. `/divisions/[key]/page.tsx` calls `divisionSnapshot()`
directly, not through an API route). **This is exactly the gap
`PRODUCTION_ARCHITECTURE.md` §2 "What Option A concretely requires"
describes**: completing the Core/Dashboard split means adding an API route
for each of these, mirroring the existing `src/repositories/*` functions,
before any Server Component can be safely moved into a Dashboard-only
deployable. Not done in this pass — enumerable, mechanical,
Human-Developer Implementation once the repository split itself is
underway.

## Contract style for new routes

```ts
// Illustrative pattern for a new Core-boundary route — matches the
// existing style in src/app/api/agents/[id]/run/route.ts exactly.
import { getCurrentUser, hasAtLeastRole } from "@/core";        // via the new src/core barrel, not @/repositories directly
import { ok, badRequest, notFound, forbidden } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!hasAtLeastRole(user, "administrator")) return forbidden("...");
  const body = await req.json().catch(() => ({}));
  // validate body shape (SECURITY_ARCHITECTURE.md "Input validation" —
  // introduce zod schemas here as routes are touched)
  // ...call the relevant @/core function, return ok(result)
}
```
