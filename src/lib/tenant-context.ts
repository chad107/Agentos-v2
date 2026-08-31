/**
 * V2 tenant + module-entitlement lookup. Additive alongside
 * src/config/tenant.ts (which still owns Valley-River-specific business
 * policy like the sales SLA window — do not duplicate that here).
 *
 * v1 is single-tenant, so these are constant-backed lookups; a real
 * multi-tenant build replaces the bodies with a database query keyed by
 * the authenticated tenant, without changing the call signature
 * (03_GAP_ANALYSIS.md gap A).
 */

import type { ModuleEntitlement, Tenant } from "@/domain/platform";
import { DIVISION_KEYS } from "@/domain/platform";
import { getTenantConfig } from "@/config/tenant";

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
