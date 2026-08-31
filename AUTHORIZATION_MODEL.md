# AgentOS — Authorization Model

Covers authentication (who is this?), tenant membership (do they have any
standing here?), and role-based permission (what are they allowed to do?).
**Status: model designed and partially scaffolded in code this session.
Real authentication is not implemented — Owner Decision + Human-Developer
Implementation.**

## Three independent layers

AgentOS already has two layers of role checking from the v1/V2 build; this
phase adds the third, which was structurally missing:

| Layer | Question | Where | Status |
|---|---|---|---|
| **1. Authentication** | Who is making this request? | `src/lib/auth.ts` `getCurrentUser()` | **Mocked** — always returns one hardcoded demo user. Real implementation is Human-Developer + Owner Decision (provider choice). |
| **2. Tenant membership** | Does this person have any standing in this tenant, and at what level? | `src/domain/authorization.ts` (new), `src/lib/tenant-context.ts` `getTenantMembership()`/`hasAtLeastTenantMembership()` (new) | **Designed + scaffolded this session.** One seeded demo membership (`u_owner` is `owner` of `vrhp`); a real implementation replaces the lookup body with a `tenant_memberships` query (`DATABASE_DESIGN.md`) without changing the call signature — the same pattern already used successfully for `getModuleEntitlements()`. |
| **3. Operational permission** | Given they're in this tenant, are they allowed to do *this specific thing*? | `src/lib/auth.ts` `hasAtLeastRole()`, `src/approvals/engine.ts` `canUserApprove()`, `APPROVER_ROLES` (`src/domain/enums.ts`) | **Real, tested, and now actually wired in** (Milestone 12 security review found and fixed the approve/reject/clarify routes calling nothing at all — see `BUILD_STATUS_V2.md`). |

Why two separate role vocabularies (layer 2's `TenantRole` vs. layer 3's
`UserRole`), rather than merging them: `UserRole` (owner / operator /
administrator / install_manager / staff / read_only) is Valley River's own
*operational* vocabulary — it doesn't generalize to a different licensee
with a different org chart. `TenantRole` (owner / admin / manager /
employee / customer) is the generic, platform-level vocabulary every
tenant shares regardless of how they title their own staff. A production
route should check **both**: does this person have standing in this tenant
at all (layer 2), and does their operational role permit this specific
action (layer 3)?

## Roles

### Tenant roles (`src/domain/authorization.ts`, new)

| Role | Rank | Description |
|---|---|---|
| `owner` | 4 | Full control: billing, entitlements, membership, everything. |
| `admin` | 3 | Manages membership, integrations, governance settings — not billing/entitlements. |
| `manager` | 2 | Approves consequential actions within their division(s); day-to-day operational authority. |
| `employee` | 1 | Uses the product day to day; cannot approve consequential actions by default. |
| `customer` | 0 | Future customer-facing role (explicitly named in the phase brief). Scoped to a narrow, read-mostly surface (e.g. their own job/ticket status). The type exists; **no route or UI honors it yet** — do not treat its presence in the enum as a shipped feature. |

### Operational roles (`src/domain/enums.ts`, unchanged from v1/V2)

`owner`, `operator`, `administrator`, `install_manager`, `staff`,
`read_only` — Valley River's existing roster shape.
`APPROVER_ROLES = [owner, operator, administrator, install_manager]`
— staff/read_only can never approve, unchanged.

## Server-side authorization on every protected operation

**Current state, verified by reading every route handler in
`src/app/api/**`:** every write-capable route already calls
`getCurrentUser()` and, where a decision is being made, `hasAtLeastRole()`
or (as of the Milestone 12 fix) `canUserApprove()`. Read-only GET routes
are intentionally open (there is exactly one demo user; a "logged out"
state doesn't exist yet). **Gap:** no route yet checks tenant membership
(layer 2) at all, because there is only one tenant. The moment a second
tenant exists, every route handler needs a `hasAtLeastTenantMembership()`
check added — see `PRODUCTION_READINESS_CHECKLIST.md` for the concrete,
enumerable list (it's every file under `src/app/api/`).

**Recommended pattern once real auth exists** (Human-Developer
Implementation — this is a design, not yet code, beyond the two functions
already scaffolded):

```ts
// Illustrative — not implemented. The actual session-reading part depends
// on the auth provider chosen (Owner Decision).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req);          // NEW — provider-specific
  if (!session) return unauthorized();
  const tenantId = session.activeTenantId;         // NEW — from the session
  if (!hasAtLeastTenantMembership(tenantId, session.userId, "manager")) {
    return forbidden("Not a member of this tenant at the required level.");
  }
  const user = getUserById(session.userId);        // existing
  if (!hasAtLeastRole(user, "administrator")) {     // existing, unchanged
    return forbidden("...");
  }
  // ...existing repository call, unchanged
}
```

## Tenant provisioning

New in this phase (`DATABASE_DESIGN.md` "Roles",
`PRODUCTION_ARCHITECTURE.md` §11): creating a new tenant is a privileged
operation, deliberately separated from regular request handling at the
database-role level (`agentos_provisioning`, `BYPASSRLS`). The onboarding
flow itself (an actual signup form, first-owner invite email, entitlement
assignment) is **not built** — Human-Developer Implementation, and the
billing/subscription trigger for it is an Owner Decision (which billing
provider, what plans map to which `ModuleEntitlement` tiers).

## Session management

**Not implemented.** Design requirements for whichever provider is chosen:

- Server-side session validation on every request (no client-trusted
  claims — a JWT's claims should be re-verified against a signature the
  server controls, or sessions should be server-stored/opaque tokens).
- Session expiry + refresh, with the active tenant re-validated on refresh
  (a user removed from a tenant mid-session should lose access promptly,
  not just at next login).
- `httpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where the flow allows)
  cookies if using cookie-based sessions — never `localStorage` for a
  session token (XSS-exfiltrable).

## What this phase deliberately did not do

- Did not pick an auth provider (Owner Decision — see
  `PRODUCTION_READINESS_CHECKLIST.md`).
- Did not add tenant-membership checks to existing API routes (would be
  premature — there's only one tenant to check against today, and doing it
  blind risks a large, untestable diff; better done alongside real auth).
- Did not change `UserRole`, `APPROVER_ROLES`, or any existing v1
  permission logic — all 53 tests (up from 47 before this phase) still
  pass unmodified for anything pre-existing.
