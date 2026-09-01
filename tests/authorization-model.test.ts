import { describe, expect, it } from "vitest";
import { getTenantMembership, hasAtLeastTenantMembership } from "@/lib/tenant-context";
import { hasAtLeastTenantRole, TENANT_ROLE_RANK, TENANT_ROLES } from "@/domain/authorization";
import type { TenantMembership } from "@/domain/authorization";

describe("AUTHORIZATION_MODEL.md — tenant membership scaffolding", () => {
  it("finds the seeded demo membership for the demo user/tenant pair", () => {
    const membership = getTenantMembership("vrhp", "u_owner");
    expect(membership).toBeDefined();
    expect(membership?.role).toBe("owner");
    expect(membership?.status).toBe("active");
  });

  it("never fabricates a membership for an unrecognized user or tenant", () => {
    expect(getTenantMembership("vrhp", "u_stranger")).toBeUndefined();
    expect(getTenantMembership("some_other_tenant", "u_owner")).toBeUndefined();
    expect(getTenantMembership("some_other_tenant", "u_stranger")).toBeUndefined();
  });

  it("hasAtLeastTenantMembership matches the direct membership check", () => {
    expect(hasAtLeastTenantMembership("vrhp", "u_owner", "owner")).toBe(true);
    expect(hasAtLeastTenantMembership("vrhp", "u_owner", "employee")).toBe(true);
    expect(hasAtLeastTenantMembership("vrhp", "u_stranger", "customer")).toBe(false);
  });

  it("ranks every tenant role consistently with TENANT_ROLES order intent (customer lowest, owner highest)", () => {
    for (const role of TENANT_ROLES) {
      expect(TENANT_ROLE_RANK[role]).toBeGreaterThanOrEqual(0);
    }
    expect(TENANT_ROLE_RANK.owner).toBeGreaterThan(TENANT_ROLE_RANK.admin);
    expect(TENANT_ROLE_RANK.admin).toBeGreaterThan(TENANT_ROLE_RANK.manager);
    expect(TENANT_ROLE_RANK.manager).toBeGreaterThan(TENANT_ROLE_RANK.employee);
    expect(TENANT_ROLE_RANK.employee).toBeGreaterThan(TENANT_ROLE_RANK.customer);
  });

  it("denies a suspended membership regardless of role", () => {
    const suspended: TenantMembership = { tenantId: "vrhp", userId: "u_owner", role: "owner", status: "suspended" };
    expect(hasAtLeastTenantRole(suspended, "customer")).toBe(false);
  });

  it("denies an undefined membership", () => {
    expect(hasAtLeastTenantRole(undefined, "customer")).toBe(false);
  });

  it("denies an invited-but-not-yet-active membership, even at the owner role", () => {
    const invited: TenantMembership = { tenantId: "vrhp", userId: "u_new", role: "owner", status: "invited" };
    expect(hasAtLeastTenantRole(invited, "customer")).toBe(false);
  });

  it("tenant/user lookup is exact-match, not case-insensitive — a differently-cased id is a different, unrecognized pairing", () => {
    expect(getTenantMembership("VRHP", "u_owner")).toBeUndefined();
    expect(getTenantMembership("vrhp", "U_OWNER")).toBeUndefined();
  });
});
