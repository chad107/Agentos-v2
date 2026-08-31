import { describe, expect, it } from "vitest";
import { buildTop3, compareRecommendations, rankRecommendations, reconcileConflict } from "@/cohen/orchestrate";
import type { Finding, Recommendation } from "@/domain";

function rec(overrides: Partial<Recommendation>): Recommendation {
  return {
    id: "rec_x",
    cohenRank: null,
    priority: "normal",
    category: "admin",
    title: "Untitled",
    summary: "summary",
    whyItMatters: "why",
    confidence: "medium",
    confidenceReason: "reason",
    sourceRefs: [],
    decisionRequired: "decide",
    dueAt: null,
    status: "surfaced",
    findingIds: [],
    ...overrides
  };
}

describe("AT-01 — Cohen's Top 3", () => {
  it("selects exactly 3 recommendations from a larger candidate pool and ranks the rest null", () => {
    const recs = [
      rec({ id: "a", priority: "high", category: "operations" }),
      rec({ id: "b", priority: "high", category: "sales" }),
      rec({ id: "c", priority: "normal", category: "financial" }),
      rec({ id: "d", priority: "normal", category: "customer" }),
      rec({ id: "e", priority: "low", category: "admin" })
    ];
    const result = buildTop3(recs);
    const ranked = result.filter((r) => r.cohenRank !== null);
    expect(ranked).toHaveLength(3);
    expect(ranked.map((r) => r.cohenRank)).toEqual([1, 2, 3]);
    expect(result.find((r) => r.id === "e")?.cohenRank).toBeNull();
  });

  it("never ranks a resolved or dismissed recommendation into the Top 3", () => {
    const recs = [
      rec({ id: "a", priority: "urgent", category: "safety", status: "resolved" }),
      rec({ id: "b", priority: "high", category: "operations" })
    ];
    const result = buildTop3(recs);
    expect(result.find((r) => r.id === "a")?.cohenRank).toBeNull();
    expect(result.find((r) => r.id === "b")?.cohenRank).toBe(1);
  });

  it("orders safety ahead of an equally-prioritized operations item (safety-first when material)", () => {
    const safetyRec = rec({ id: "safety_1", priority: "high", category: "safety" });
    const opsRec = rec({ id: "ops_1", priority: "high", category: "operations" });
    const ranked = rankRecommendations([opsRec, safetyRec]);
    expect(ranked[0]?.id).toBe("safety_1");
  });

  it("ranks urgent priority ahead of high priority regardless of category", () => {
    const urgentAdmin = rec({ id: "u", priority: "urgent", category: "admin" });
    const highSafety = rec({ id: "h", priority: "high", category: "safety" });
    const ranked = rankRecommendations([highSafety, urgentAdmin]);
    expect(ranked[0]?.id).toBe("u");
  });

  it("breaks ties within the same priority/category by the sooner due date", () => {
    const soon = rec({ id: "soon", priority: "high", category: "sales", dueAt: "2026-01-01T09:00:00Z" });
    const later = rec({ id: "later", priority: "high", category: "sales", dueAt: "2026-01-01T17:00:00Z" });
    const ranked = rankRecommendations([later, soon]);
    expect(ranked[0]?.id).toBe("soon");
  });

  it("compareRecommendations is a valid comparator (stable, antisymmetric on distinct ids)", () => {
    const a = rec({ id: "a" });
    const b = rec({ id: "b" });
    expect(Math.sign(compareRecommendations(a, b))).toBe(-Math.sign(compareRecommendations(b, a)));
  });
});

describe("AT-11 — agent disagreement is reconciled, not auto-resolved", () => {
  it("surfaces both agents' evidence and does not pick a winner", () => {
    const salesFinding: Finding = {
      id: "f_sales",
      agentId: "sales",
      findingType: "schedule_pressure",
      severity: "high",
      title: "Customer wants to schedule immediately",
      summary: "Sales recommends scheduling the install this week to protect the sale.",
      entityRefs: ["job:job_x"],
      evidenceRefs: ["jobber:quote_9"],
      confidence: "medium",
      detectedAt: new Date().toISOString(),
      status: "open"
    };
    const opsFinding: Finding = {
      id: "f_ops",
      agentId: "operations",
      findingType: "equipment_unconfirmed",
      severity: "high",
      title: "Equipment is not confirmed",
      summary: "Operations flags that equipment for this job is not yet confirmed with the supplier.",
      entityRefs: ["job:job_x"],
      evidenceRefs: ["ops:req_1"],
      confidence: "high",
      detectedAt: new Date().toISOString(),
      status: "open"
    };

    const reconciliation = reconcileConflict("job:job_x", [salesFinding, opsFinding]);

    expect(reconciliation.agentPositions).toHaveLength(2);
    expect(reconciliation.agentPositions.map((p) => p.agentId)).toEqual(
      expect.arrayContaining(["sales", "operations"])
    );
    // Cohen must not silently choose — it hands the decision to a human.
    expect(reconciliation.humanDecisionRequired).toBeTruthy();
  });

  it("requires at least two findings to reconcile", () => {
    expect(() => reconcileConflict("job:job_x", [])).toThrow();
  });
});
