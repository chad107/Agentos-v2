import { describe, expect, it } from "vitest";
import { jsaCadenceStatus } from "@/lib/jsa-cadence";

describe("AT-08 — daily JSA cadence (4:00 PM reminder, 4:30 PM escalation)", () => {
  const reminderAt = new Date("2026-08-28T16:00:00");
  const escalationAt = new Date("2026-08-28T16:30:00");

  it("is 'missing' before the 4:00 PM reminder", () => {
    const now = new Date("2026-08-28T15:59:00");
    expect(jsaCadenceStatus(now, reminderAt, escalationAt)).toBe("missing");
  });

  it("is 'reminded' between 4:00 PM and 4:30 PM", () => {
    const now = new Date("2026-08-28T16:15:00");
    expect(jsaCadenceStatus(now, reminderAt, escalationAt)).toBe("reminded");
  });

  it("is 'escalated' at/after 4:30 PM", () => {
    const now = new Date("2026-08-28T16:30:00");
    expect(jsaCadenceStatus(now, reminderAt, escalationAt)).toBe("escalated");
  });
});
