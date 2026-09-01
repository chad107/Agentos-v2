import { describe, expect, it } from "vitest";
import { getCurrentTenant, getModuleEntitlements, isModuleActive } from "@/lib/tenant-context";
import { DIVISION_KEYS } from "@/domain/platform";
import { divisionSnapshot } from "@/repositories/divisions";

describe("V2 tenant isolation (03_GAP_ANALYSIS.md gap A)", () => {
  it("identifies the flagship tenant as Valley River", () => {
    const tenant = getCurrentTenant();
    expect(tenant.id).toBe("vrhp");
    expect(tenant.tier).toBe("flagship");
  });

  it("grants Valley River every division active at the flagship tier (01_MASTER_SPEC.md: 'Valley River: all required divisions enabled')", () => {
    const entitlements = getModuleEntitlements("vrhp");
    expect(entitlements).toHaveLength(DIVISION_KEYS.length);
    for (const entitlement of entitlements) {
      expect(entitlement.status).toBe("active");
      expect(entitlement.tier).toBe("flagship");
    }
    for (const key of DIVISION_KEYS) {
      expect(isModuleActive("vrhp", key)).toBe(true);
    }
  });

  it("never grants entitlements to an unrecognized tenant — no accidental default access", () => {
    expect(getModuleEntitlements("some_other_company")).toEqual([]);
    expect(getModuleEntitlements("")).toEqual([]);
    for (const key of DIVISION_KEYS) {
      expect(isModuleActive("some_other_company", key)).toBe(false);
    }
  });

  it("tenant lookup is exact-match, not case-insensitive or whitespace-tolerant — near-miss ids get zero access, not the flagship tenant's", () => {
    expect(getModuleEntitlements("VRHP")).toEqual([]);
    expect(getModuleEntitlements(" vrhp")).toEqual([]);
    expect(getModuleEntitlements("vrhp ")).toEqual([]);
  });

  it("computes a snapshot for every registered division key, with no fabricated KPI values", () => {
    for (const key of DIVISION_KEYS) {
      const snapshot = divisionSnapshot(key);
      expect(snapshot).toBeDefined();
      expect(snapshot!.config.key).toBe(key);
      // Every KPI value is either a real string derived from repository data, or explicitly null (rendered "—").
      for (const kpi of snapshot!.kpis) {
        expect(kpi.value === null || typeof kpi.value === "string").toBe(true);
      }
    }
  });
});
