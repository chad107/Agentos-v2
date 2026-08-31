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
  it("sets Valley River's sales response SLA to 60 minutes per 01_MASTER_SPEC.md ('business-day lead response <=60 minutes'), configurable per company", () => {
    expect(getTenantConfig().salesResponseSlaMinutes).toBe(60);
    expect(salesResponseSlaMinutes()).toBe(60);
  });

  it("flags a business-day lead older than its own slaDueAt with no response as breached", () => {
    // This lead's fixed slaDueAt (15:00) is independent of the tenant config —
    // isSlaBreached only ever compares slaDueAt to the reference time.
    const reference = new Date("2026-08-28T15:01:00.000Z"); // 1 minute past this lead's slaDueAt
    expect(isSlaBreached(lead({}), reference)).toBe(true);
  });

  it("does not flag a lead that has already been responded to", () => {
    const reference = new Date("2026-08-28T16:00:00.000Z");
    expect(isSlaBreached(lead({ respondedAt: "2026-08-28T13:30:00.000Z" }), reference)).toBe(false);
  });

  it("does not flag a lead still inside its SLA window", () => {
    const reference = new Date("2026-08-28T13:30:00.000Z"); // well before this lead's 15:00 slaDueAt
    expect(isSlaBreached(lead({}), reference)).toBe(false);
  });
});
