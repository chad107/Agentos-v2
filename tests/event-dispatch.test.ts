import { describe, expect, it } from "vitest";
import { decideReject, listActivity, listProposals } from "@/repositories";
import { getWorkflow } from "@/config/workflows";

describe("Milestone 9 — event -> workflow dispatch loop (src/events/dispatcher.ts)", () => {
  it("registers the executive loop workflow as event-triggered on approval.resolved", () => {
    const workflow = getWorkflow("executive_loop");
    expect(workflow?.status).toBe("active");
    expect(workflow?.triggerType).toBe("event");
    expect(workflow?.triggerEventType).toBe("approval.resolved");
  });

  it("routes a real approval.resolved event to the executive loop workflow and records it in the audit trail", () => {
    const pending = listProposals({ status: "pending" })[0];
    expect(pending).toBeTruthy();
    if (!pending) return;

    const before = listActivity({ eventType: "workflow.routed" }).length;
    const result = decideReject(pending.id, "u_owner", "Test rejection to exercise the dispatch loop.");
    expect(result.ok).toBe(true);

    const routed = listActivity({ eventType: "workflow.routed" });
    expect(routed.length).toBeGreaterThan(before);
    expect(routed.some((e) => e.summary.includes("Executive loop"))).toBe(true);
  });
});
