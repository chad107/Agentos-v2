/**
 * PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
 *
 * V2 tenant + module-entitlement lookup. Additive alongside
 * src/config/tenant.ts (which still owns Valley-River-specific business
 * policy like the sales SLA window — do not duplicate that here).
 *
 * v1 is single-tenant, so these are constant-backed lookups; a real
 * multi-tenant build replaces the bodies with a database query keyed by
 * the authenticated tenant, without changing the call signature
 * (03_GAP_ANALYSIS.md gap A). See AUTHORIZATION_MODEL.md.
 */

import type { ModuleEntitlement, Tenant } from "@/domain/platform";
import { DIVISION_KEYS } from "@/domain/platform";
import { getTenantConfig } from "@/config/tenant";
import type { TenantMembership, TenantRole } from "@/domain/authorization";
import { hasAtLeastTenantRole } from "@/domain/authorization";

const PLATFORM_LAUNCH_DATE = "2024-01-01T00:00:00.000Z";

export function getCurrentTenant(): Tenant {
  const cfg = getTenantConfig();
  return {
    id: cfg.businessId,
    name: cfg.businessName,
    timezone: cfg.timezone,
    tier: "flagship",
    createdAt: PLATFORM_LAUNCH_DATE
  };
}

/**
 * Valley River is the flagship tenant and receives every required division
 * active at the flagship tier (01_MASTER_SPEC.md "Modular licensing:
 * Valley River: all required divisions enabled"). Any other tenant id
 * returns no entitlements until real licensing storage exists — this
 * function must never fabricate access for an unrecognized tenant.
 */
export function getModuleEntitlements(tenantId: string): ModuleEntitlement[] {
  if (tenantId !== getCurrentTenant().id) return [];
  return DIVISION_KEYS.map((moduleKey) => ({
    tenantId,
    moduleKey,
    status: "active",
    tier: "flagship",
    activatedAt: PLATFORM_LAUNCH_DATE,
    expiresAt: null,
    configuration: {}
  }));
}

export function isModuleActive(tenantId: string, moduleKey: (typeof DIVISION_KEYS)[number]): boolean {
  return getModuleEntitlements(tenantId).some((e) => e.moduleKey === moduleKey && e.status === "active");
}

/**
 * Tenant membership lookup (AUTHORIZATION_MODEL.md). Scaffolding for real
 * multi-user, multi-tenant auth: today there is exactly one demo user
 * (`u_owner`, src/lib/auth.ts) and one tenant (`vrhp`), so this is a
 * constant-backed single row — matching the same "real shape, demo data"
 * pattern as `getModuleEntitlements` above. A real implementation replaces
 * the body with a `tenant_memberships` query (db/migrations/0001_extensions_and_tenants.sql)
 * keyed by the authenticated user, without changing the call signature.
 *
 * Never fabricates a membership for a user/tenant pair that isn't the
 * seeded demo pair — mirrors `getModuleEntitlements`'s "no accidental
 * default access" guarantee.
 */
const DEMO_MEMBERSHIP: TenantMembership = {
  tenantId: "vrhp",
  userId: "u_owner",
  role: "owner",
  status: "active"
};

export function getTenantMembership(tenantId: string, userId: string): TenantMembership | undefined {
  if (tenantId === DEMO_MEMBERSHIP.tenantId && userId === DEMO_MEMBERSHIP.userId) {
    return DEMO_MEMBERSHIP;
  }
  return undefined;
}

/**
 * Guard for a protected operation: does this user have at least `minimum`
 * tenant role within `tenantId`? Distinct from — and checked in addition
 * to — `hasAtLeastRole()`/`canUserApprove()` (src/lib/auth.ts,
 * src/approvals/engine.ts), which gate Valley-River-specific operational
 * permissions. This gates "does this person have any standing in this
 * tenant at all."
 */
export function hasAtLeastTenantMembership(tenantId: string, userId: string, minimum: TenantRole): boolean {
  return hasAtLeastTenantRole(getTenantMembership(tenantId, userId), minimum);
}
