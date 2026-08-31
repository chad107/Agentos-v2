# AgentOS — Security Architecture

Covers the non-functional security requirements from
`01_MASTER_SPEC.md` "Security and non-functional requirements" and the
phase brief's full checklist. Each item is labeled **Completed**,
**Mocked**, **Blocked External**, or **Human Review Required**. This
document is the security counterpart to `PRODUCTION_ARCHITECTURE.md`;
`INTEGRATION_SECURITY.md` covers the vendor-specific subset in depth.

## Secrets & credential management

**Status: policy defined, no secrets currently exist to manage (verified).**
`.env.example` (`ENVIRONMENT_VARIABLES.example` in this phase) documents
every configuration surface with empty values; a repo-wide grep for
`key|secret|password|token|bearer` patterns across `src/` (Milestone 12 and
re-confirmed this phase) found no hardcoded credentials. Going forward:

- Real secrets belong in the deployment platform's secret manager (e.g.
  AWS Secrets Manager, Vercel encrypted env vars, Doppler) — never in a
  committed file, never in `NEXT_PUBLIC_*` variables (those are shipped to
  the browser bundle).
- Vendor OAuth client secrets and access/refresh tokens (once any
  integration moves past mock) need their own encrypted store, not a plain
  environment variable per tenant — see `INTEGRATION_SECURITY.md` "Token
  storage."
- **Human Review Required:** add automated secret scanning (gitleaks or
  equivalent) to CI before any external developer is given repository
  access — recommended in `IP_BOUNDARY.md`, not yet wired up (no CI exists
  yet — see `DEPLOYMENT_GUIDE.md`).

## Environment configuration

**Status: Completed (template) — see `ENVIRONMENT_VARIABLES.example`.**
Every variable this build knows about, real or anticipated, is documented
there with a one-line purpose note and whether it's required to run the
demo (none are). `NEXT_PHASE` and `VITEST` — both used by
`src/data/persistence.ts` to gate local persistence — are set by the
tooling itself, not by a human, and are documented for completeness.

## Encryption in transit / at rest

**Status: Human Review Required / Blocked External (depends on hosting choice).**

- In transit: TLS termination is the hosting platform's responsibility
  (Vercel, a load balancer, etc.) — not something application code
  controls directly. Requirement: TLS 1.2+ only, HSTS header set (see
  "Security headers" below).
- At rest: depends entirely on the database provider chosen
  (`DATABASE_DESIGN.md`) — most managed Postgres providers encrypt at rest
  by default; confirm explicitly with whichever is selected, don't assume.
- The local SQLite persistence file (`src/data/persistence.ts`) is **not**
  encrypted at rest today — acceptable for the current single-tenant demo
  stopgap, not acceptable once real tenant data exists there. Flagged in
  `DATABASE_DESIGN.md` as part of why it's explicitly not the production
  answer.

## Audit logging & immutable security/event history

**Status: Completed (application layer), Human Review Required (database enforcement).**
`src/audit/log.ts` is append-only in application code (no update/delete
exported) and every material action already writes a correlated audit
event — this predates this phase and was verified again while writing
`DATABASE_DESIGN.md`. This phase adds the database-level backstop:
`audit_events`, `approval_decisions`, and `event_log` are designed to have
`UPDATE`/`DELETE` revoked from the application's database role entirely
(`db/migrations/0004_events_memory_audit.sql`), so even a future
application bug (an over-broad admin tool, a bad migration) can't quietly
rewrite history — only `agentos_migrator` (never used by the running app)
could. Not yet executed against a live environment since no environment
exists yet.

## Rate limiting & abuse protection

**Status: Not implemented — Human-Developer Implementation.** No rate
limiting exists anywhere in this build today. Recommended approach for a
Next.js API-route architecture: a token-bucket or sliding-window limiter
at the edge (many hosting platforms offer this natively — e.g. Vercel's
built-in Web Application Firewall / rate limiting, or a small Redis-backed
limiter in middleware if self-hosting). Priority order once implemented:
`/api/approvals/*` (consequential-action endpoints), `/api/agents/:id/run`,
`/api/kpis` POST — the write-capable routes — before the read-only ones.

## Input validation

**Status: Partial.** Every route already type-narrows its request body
manually (e.g. `typeof body?.reason === "string"` in the approve/reject
routes) rather than trusting the shape — this is real, if ad hoc,
validation. **Gap:** no schema validation library (zod, etc.) is in use, so
there's no single place that rejects an unexpected extra field or a
wrong-shaped nested object. **Recommendation:** introduce zod (or
equivalent) schemas per route as routes are touched for the Core/Dashboard
API contract work (`API_CONTRACT.md`) — not done wholesale in this pass to
avoid a large, high-risk diff across every route file at once.

## CSRF / XSS / injection — specific to this Next.js architecture

- **XSS:** verified (Milestone 12 security review, re-confirmed this
  phase): no `dangerouslySetInnerHTML` or equivalent unsafe sink exists
  anywhere in `src/`. React/Next auto-escape JSX interpolation by default
  — this is a real, structural protection, not just an absence of bugs
  found so far.
- **SQL/NoSQL injection:** not applicable to the current in-memory/SQLite
  store (no raw string-concatenated queries exist). **Forward-looking
  requirement for the Postgres migration** (`DATABASE_DESIGN.md`): every
  query must use parameterized queries or a query builder/ORM that
  parameterizes automatically (e.g. `pg` with parameterized `$1, $2`, or
  Prisma/Drizzle) — never string-interpolate a value into SQL. This is a
  requirement for whoever implements the DB swap, not yet a risk today
  since no such queries exist yet.
- **CSRF:** Next.js API routes reading only `Authorization` headers (not
  ambient cookies) are inherently CSRF-resistant, since a cross-site
  request can't forge a header. If cookie-based sessions are chosen
  instead (`AUTHORIZATION_MODEL.md`), add CSRF tokens on state-changing
  requests or rely on `SameSite=Strict`/`Lax` cookies plus origin checking
  — a concrete decision to make once the auth provider is chosen, not
  before.
- **Command/path injection:** verified (Milestone 12 and re-confirmed):
  no `eval`, `child_process`, or filesystem path built from user input
  exists anywhere in `src/`.

### Security headers

**Status: Not implemented.** `next.config.js` has no `headers()` block
today. Recommended baseline once a deployment target exists: `Content-Security-Policy`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or
`frame-ancestors 'none'` via CSP), `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security`. Low-risk, Human-Developer Implementation —
not added speculatively in this pass since CSP in particular needs tuning
against the real script/style sources once a hosting target and any
third-party embeds are known.

## Session management

See `AUTHORIZATION_MODEL.md` "Session management" — real sessions don't
exist yet (one hardcoded demo user).

## Production error handling

**Status: Partial.** API routes already return typed error responses
(`src/lib/api.ts` `badRequest`/`notFound`/`forbidden`) rather than leaking
stack traces — verified by reading every route handler. **Gap:** no global
error boundary/handler exists for uncaught exceptions in a route handler
(a bug would currently surface Next.js's default error response, which in
production mode does not leak stack traces by default, but this hasn't
been explicitly configured or tested end-to-end). **Recommendation:**
add a `global-error.tsx` (Next.js App Router convention) for uncaught UI
errors, and confirm `NODE_ENV=production` suppresses stack traces in API
error responses before launch — a `PRODUCTION_READINESS_CHECKLIST.md` item.

## Monitoring & observability

**Status: Not implemented — Blocked External (needs a real deployment + a chosen provider).**

- **Application logs:** currently `console.warn` in a few places
  (`src/data/persistence.ts`'s degraded-mode warnings) and Next.js's own
  request logging in dev. No structured logging (JSON logs with
  correlation ids) exists. Recommendation: adopt a structured logger
  (pino is a common Next.js-compatible choice) and propagate the existing
  `correlationId` (already present on every `AuditEvent` —
  `src/audit/log.ts`) into log lines, so an audit trail entry and its
  corresponding application log lines can be joined.
- **Security logs:** the audit trail (`audit_events`) already functions as
  a security-relevant event log for in-app actions. Infrastructure-level
  security logs (failed auth attempts, rate-limit trips) don't exist yet
  because auth/rate-limiting don't exist yet.
- **Health checks:** no `/api/health` route exists. Trivial to add
  (Human-Developer Implementation, ~10 lines) once there's a real database
  to check connectivity against — a health check against the in-memory
  store would be meaningless (it's always "up").
- **Alerting:** depends entirely on the monitoring provider chosen (Owner
  Decision) — Sentry/Datadog/CloudWatch/etc. are all reasonable; no
  preference is baked into this codebase.

## Backup / recovery

See `DATABASE_DESIGN.md` "Backup, restore, retention" — Owner Decision,
dependent on database provider choice.

## Summary table

| Control | Status |
|---|---|
| Secrets management | Policy defined; nothing to manage yet |
| Encryption in transit | Human Review (hosting choice) |
| Encryption at rest | Human Review (DB provider choice) |
| Audit logging | Completed (app layer) + designed (DB layer) |
| Rate limiting | Not implemented |
| Input validation | Partial (manual); schema validation recommended |
| XSS protection | Completed (verified, structural) |
| SQL injection protection | N/A today; requirement documented for DB migration |
| CSRF protection | Depends on session strategy (not chosen yet) |
| Security headers | Not implemented |
| Session management | Not implemented (no real auth yet) |
| Error handling | Partial |
| Monitoring/observability | Not implemented |
| Health checks | Not implemented |
| Backup/recovery | Human Review (DB provider choice) |
