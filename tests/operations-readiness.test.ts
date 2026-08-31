import { describe, expect, it } from "vitest";
import { isWithinReadinessWindow } from "@/repositories/operations";
import { businessDaysFromNow, daysFromNow } from "@/lib/dates";
import type { Job } from "@/domain";

function job(overrides: Partial<Job>): Job {
  return {
    id: "job_test",
    jobberId: "1",
    customerRef: "c1",
    customerName: "Test Customer",
    serviceType: "Ducted heat pump install",
    community: "Kentville",
    scheduledStart: new Date().toISOString(),
    crewRefs: ["u_al"],
    stage: "material_check",
    readinessStatus: "needs_review",
    readinessScore: 50,
    jobberEstimateRef: "estimate_1",
    openQuestions: [],
    ...overrides
  };
}

describe("AT-07 — operations readiness window", () => {
  it("treats a job scheduled within 3 business days as inside the readiness window", () => {
    const reference = new Date();
    const scheduled = businessDaysFromNow(2, reference);
    const j = job({ scheduledStart: scheduled.toISOString() });
    expect(isWithinReadinessWindow(j, reference)).toBe(true);
  });

  it("treats a job scheduled well beyond 3 business days as outside the readiness window", () => {
    const reference = new Date();
    const scheduled = daysFromNow(30, reference);
    const j = job({ scheduledStart: scheduled.toISOString() });
    expect(isWithinReadinessWindow(j, reference)).toBe(false);
  });
});
