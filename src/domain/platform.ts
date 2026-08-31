/**
 * V2 platform-layer types: tenant, module entitlement, and division registry
 * shapes. Additive to the v1 domain model in ./entities.ts and ./enums.ts,
 * which stay untouched. Source: 01_MASTER_SPEC.md "Product architecture",
 * "Modular licensing", "Divisions and agents".
 */

export const DIVISION_KEYS = [
  "sales",
  "marketing",
  "operations",
  "finance",
  "safety",
  "customer_experience",
  "administration",
  "executive_intelligence"
] as const;
export type DivisionKey = (typeof DIVISION_KEYS)[number];

export type ModuleEntitlementStatus = "active" | "inactive" | "trial" | "suspended";
export type ModuleTier = "starter" | "pro" | "enterprise" | "flagship";

/** Source: 01_MASTER_SPEC.md "Suggested entitlement object". */
export interface ModuleEntitlement {
  tenantId: string;
  moduleKey: DivisionKey;
  status: ModuleEntitlementStatus;
  tier: ModuleTier;
  activatedAt: string;
  expiresAt: string | null;
  configuration: Record<string, unknown>;
}

export interface Tenant {
  id: string;
  name: string;
  timezone: string;
  tier: ModuleTier;
  createdAt: string;
}

export interface DivisionAgentRoster {
  manager: string;
  specialists: string[];
}

/**
 * "live" divisions are backed by real repository data already in this
 * codebase (src/repositories/*). "mocked" divisions have no data source yet
 * and must say so in the UI rather than showing fabricated numbers —
 * 01_MASTER_SPEC.md "Do not fabricate".
 */
export type DivisionDataStatus = "live" | "mocked";

export interface DivisionConfig {
  key: DivisionKey;
  label: string;
  missionSummary: string;
  roster: DivisionAgentRoster;
  /** The named KPIs for this division per 01_MASTER_SPEC.md. Not every KPI has a wired data source yet. */
  kpiLabels: string[];
  /** An existing v1 route with deeper, division-specific UI, preserved rather than replaced. */
  legacyRoute: string | null;
  dataStatus: DivisionDataStatus;
}
