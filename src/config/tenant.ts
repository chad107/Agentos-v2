/**
 * Tenant (company) configuration surface.
 *
 * AgentOS is a multi-tenant platform — business rules like SLA windows are
 * a *company's* policy, not something the generic platform should hardcode.
 * This module is the one place those defaults live for v1 (a single-tenant
 * demo build). When multi-tenant settings storage exists, `getTenantConfig()`
 * becomes a lookup by business id instead of a constant — callers should
 * depend on this function, never on the literal minute value, so that swap
 * is invisible to the rest of the app.
 *
 * Do not hard-code Valley River-specific policy anywhere else in the
 * codebase — route it through here so it can be overridden per company.
 */

export interface TenantConfig {
  businessId: string;
  businessName: string;
  timezone: string;
  /**
   * Minutes a new lead has to receive a first response before it's
   * considered outside SLA (03_DASHBOARD_UX_SPEC.md "Sales SLA";
   * AT-05). Platform default is 120 minutes; any individual company may
   * configure a stricter or looser window in tenant settings.
   */
  salesResponseSlaMinutes: number;
}

/** Platform-wide default, used until a tenant has configured its own value. */
export const DEFAULT_SALES_RESPONSE_SLA_MINUTES = 120;

const TENANT_CONFIGS: Record<string, TenantConfig> = {
  vrhp: {
    businessId: "vrhp",
    businessName: "Valley River Heat Pumps",
    timezone: "America/Halifax",
    salesResponseSlaMinutes: DEFAULT_SALES_RESPONSE_SLA_MINUTES
  }
};

/**
 * Returns the active tenant's configuration. v1 runs a single business
 * (`vrhp`), so this ignores its argument and returns that config — the
 * parameter exists so call sites are already shaped for multi-tenant
 * lookup later.
 */
export function getTenantConfig(businessId: string = "vrhp"): TenantConfig {
  return TENANT_CONFIGS[businessId] ?? TENANT_CONFIGS.vrhp!;
}
