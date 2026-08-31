/**
 * Pure daily-JSA cadence function, extracted for testability (AT-08).
 * Source: CLAUDE.md "Daily cadence" — 4:00 PM reminder, 4:30 PM escalation.
 */
export type JsaCadenceStatus = "missing" | "reminded" | "escalated";

export function jsaCadenceStatus(now: Date, reminderAt: Date, escalationAt: Date): JsaCadenceStatus {
  if (now.getTime() >= escalationAt.getTime()) return "escalated";
  if (now.getTime() >= reminderAt.getTime()) return "reminded";
  return "missing";
}
