/**
 * PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
 *
 * Platform-level tenant membership/role model for multi-tenant SaaS
 * authorization (AUTHORIZATION_MODEL.md). Additive alongside the existing
 * v1 `UserRole` (src/domain/enums.ts — owner/operator/administrator/
 * install_manager/staff/read_only), which stays exactly as-is: that enum
 * is Valley River's own *operational* role vocabulary and is still what
 * `canUserApprove()`/`hasAtLeastRole()` (src/lib/auth.ts,
 * src/approvals/engine.ts) check against for in-app permission gating.
 *
 * `TenantRole` here is a different, narrower concern: whether a person has
 * any relationship to a given tenant at all, and at what level, before
 * `UserRole`-based checks even apply. This is the seam a real multi-tenant
 * SaaS product needs that a single-tenant demo doesn't: one person may be
 * an `owner` of one licensed tenant and have no membership at all in
 * another. Matches db/migrations/0001_extensions_and_tenants.sql
 * `tenant_memberships.role` exactly.
 */

export const TENANT_ROLES = ["owner", "admin", "manager", "employee", "customer"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

/** Higher rank can do everything a lower rank can, within a tenant. `customer` is intentionally unranked (0) — see TENANT_ROLE_DESCRIPTIONS. */
export const TENANT_ROLE_RANK: Record<TenantRole, number> = {
  customer: 0,
  employee: 1,
  manager: 2,
  admin: 3,
  owner: 4
};

export const TENANT_ROLE_DESCRIPTIONS: Record<TenantRole, string> = {
  owner: "Full control of the tenant: billing, entitlements, membership, and every operational permission.",
  admin: "Manages membership, integrations, and governance settings; not billing/entitlements.",
  manager: "Approves consequential actions within their division(s); day-to-day operational authority.",
  employee: "Uses the product day to day; cannot approve consequential actions by default.",
  customer: "Future customer-facing role (01_MASTER_SPEC.md phase brief) — scoped to a narrow, read-mostly surface (e.g. their own job/ticket status). Not wired to any route yet; exists here so the type system and DB schema are ready before the UI is built."
};

export type TenantMembershipStatus = "active" | "invited" | "suspended";

export interface TenantMembership {
  tenantId: string;
  userId: string;
  role: TenantRole;
  status: TenantMembershipStatus;
}

export function hasAtLeastTenantRole(membership: TenantMembership | undefined, minimum: TenantRole): boolean {
  if (!membership || membership.status !== "active") return false;
  return TENANT_ROLE_RANK[membership.role] >= TENANT_ROLE_RANK[minimum];
}
