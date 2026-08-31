import { describe, expect, it } from "vitest";
import { isSlaBreached, salesResponseSlaMinutes } from "@/repositories/sales";
import { getTenantConfig } from "@/config/tenant";
import type { Lead } from "@/domain";

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: "lead_test",
    source: "jobber",
    customerRef: "c1",
    customerName: "Test Customer",
    serviceType: "Ducted install",
    createdAt: "2026-08-28T13:00:00.000Z",
    respondedAt: null,
    slaDueAt: "2026-08-28T15:00:00.000Z",
    stage: "new",
    ownerId: "u_tanya",
    ownerName: "Tanya",
    latestTouch: "Jobber request received",
    nextAction: "Respond",
    score: "at_risk",
    jobberRef: null,
    quoteRef: null,
    quoteSentAt: null,
    quoteValue: null,
    ...overrides
  };
}

describe("AT-05 — lead response SLA", () => {
  it("defaults the tenant's sales response SLA to 120 minutes, configurable per company", () => {
    expect(getTenantConfig().salesResponseSlaMinutes).toBe(120);
    expect(salesResponseSlaMinutes()).toBe(120);
  });

  it("flags a business-day lead older than the configured SLA with no response as breached", () => {
    const reference = new Date("2026-08-28T15:01:00.000Z"); // 1 minute past the 120-minute SLA
    expect(isSlaBreached(lead({}), reference)).toBe(true);
  });

  it("does not flag a lead that has already been responded to", () => {
    const reference = new Date("2026-08-28T16:00:00.000Z");
    expect(isSlaBreached(lead({ respondedAt: "2026-08-28T13:30:00.000Z" }), reference)).toBe(false);
  });

  it("does not flag a lead still inside its SLA window", () => {
    const reference = new Date("2026-08-28T13:30:00.000Z"); // 30 minutes in, well inside 120
    expect(isSlaBreached(lead({}), reference)).toBe(false);
  });
});
