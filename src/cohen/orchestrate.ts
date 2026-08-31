/**
 * Cohen manager layer: ranking, Top 3 selection, and conflict reconciliation.
 * Source: CLAUDE.md "Priority model", 02_SYSTEM_ARCHITECTURE.md
 * "Recommendation pipeline" steps 5-6, 04_AGENT_ROLES_AND_WORKFLOWS.md
 * "Agent disagreement".
 *
 * Cohen does not silently pick a side when specialist agents disagree
 * (AT-11) — reconcileConflict() produces a recommendation that surfaces
 * both agents' evidence and leaves the decision to a human.
 */

import type { Finding, Recommendation } from "@/domain";
import { CATEGORY_PRIORITY_ORDER, PRIORITY_LEVELS } from "@/domain";

const priorityRank = new Map(PRIORITY_LEVELS.map((p, i) => [p, i]));
const categoryRank = new Map(CATEGORY_PRIORITY_ORDER.map((c, i) => [c, i]));

/**
 * Composite ordering: urgency first (an urgent exception may interrupt
 * regardless of category), then category priority (safety > financial >
 * customer > operations > sales > admin), then soonest deadline, then a
 * stable fallback on id so ordering never depends on object identity.
 */
export function compareRecommendations(a: Recommendation, b: Recommendation): number {
  const byPriority = (priorityRank.get(a.priority) ?? 99) - (priorityRank.get(b.priority) ?? 99);
  if (byPriority !== 0) return byPriority;

  const byCategory = (categoryRank.get(a.category) ?? 99) - (categoryRank.get(b.category) ?? 99);
  if (byCategory !== 0) return byCategory;

  const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;

  return a.id.localeCompare(b.id);
}

export function rankRecommendations(recommendations: Recommendation[]): Recommendation[] {
  return recommendations.slice().sort(compareRecommendations);
}

/**
 * Selects and ranks the 6:00 AM Top 3 (CLAUDE.md "Daily cadence";
 * 03_DASHBOARD_UX_SPEC.md "Cohen 6:00 AM Top 3"). Only `action_pending` /
 * `new` / `surfaced` recommendations are eligible — resolved/dismissed items
 * never occupy a Top 3 slot. Returns ALL recommendations with `cohenRank`
 * set on the winners and cleared on everyone else, so callers can persist
 * the result without losing the rest of the queue (AT-01: still surfaced
 * elsewhere, e.g. Approvals/Sales/Operations, not just discarded).
 */
export function buildTop3(recommendations: Recommendation[]): Recommendation[] {
  const eligible = recommendations.filter((r) =>
    ["new", "surfaced", "action_pending"].includes(r.status)
  );
  const ranked = rankRecommendations(eligible);
  const top3Ids = new Set(ranked.slice(0, 3).map((r) => r.id));

  return recommendations.map((r) => {
    if (!top3Ids.has(r.id)) {
      return r.cohenRank === null ? r : { ...r, cohenRank: null };
    }
    const rank = ranked.findIndex((x) => x.id === r.id) + 1;
    return { ...r, cohenRank: rank };
  });
}

export interface ConflictReconciliation {
  entityRef: string;
  summary: string;
  agentPositions: { agentId: Finding["agentId"]; position: string; evidenceRefs: string[]; confidence: Finding["confidence"] }[];
  humanDecisionRequired: string;
}

/**
 * Presents competing findings about the same entity side by side rather than
 * auto-resolving them (04_AGENT_ROLES_AND_WORKFLOWS.md "Agent disagreement";
 * AT-11). Cohen never picks Sales over Operations (or vice versa) on its own.
 */
export function reconcileConflict(
  entityRef: string,
  findings: Finding[]
): ConflictReconciliation {
  if (findings.length < 2) {
    throw new Error("reconcileConflict requires at least two competing findings.");
  }
  const agentPositions = findings.map((f) => ({
    agentId: f.agentId,
    position: f.summary,
    evidenceRefs: f.evidenceRefs,
    confidence: f.confidence
  }));
  const agentNames = Array.from(new Set(findings.map((f) => f.agentId))).join(" and ");
  return {
    entityRef,
    summary: `${agentNames} agents have conflicting findings on ${entityRef}. Cohen is presenting both — a human decides.`,
    agentPositions,
    humanDecisionRequired: "Choose how to proceed given the competing evidence below."
  };
}

/** A short, calm state line for the Cohen header (11_UI_COPY_AND_STATES.md). */
export function cohenHeaderMessage(counts: { urgent: number; decisions: number }): string {
  if (counts.urgent > 0) {
    return `${counts.urgent === 1 ? "One urgent item needs" : `${counts.urgent} urgent items need`} your attention first.`;
  }
  if (counts.decisions === 0) {
    return "Nothing urgent is unresolved. I have a few routine recommendations.";
  }
  return `Good morning. I found ${counts.decisions} decision${counts.decisions === 1 ? "" : "s"} worth your attention this morning.`;
}
