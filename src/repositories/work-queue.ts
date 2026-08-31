// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Unified Work Queue read model (01_MASTER_SPEC.md "Work Queue"). Merges
 * open Approval Centre proposals (src/repositories/approvals.ts) with
 * "Nothing Left Behind" tracked items (src/repositories/tracked.ts) into
 * one filterable-by-division list. Both source pages remain unchanged and
 * are still the deeper, type-specific views this queue links back to.
 */

import type { WorkItem } from "@/domain/platform";
import { listProposals } from "./approvals";
import { trackedItems, TRACKED_CATEGORY_LABELS } from "./tracked";
import { divisionForRecommendationCategory, divisionForTrackedArea } from "./divisions";

const TRACKED_PRIORITY: Record<string, WorkItem["priority"]> = {
  overdue: "urgent",
  unassigned: "high",
  waiting: "normal",
  missing_info: "normal",
  upcoming: "low"
};

export function unifiedWorkQueue(): WorkItem[] {
  const approvalItems: WorkItem[] = listProposals()
    .filter((p) => p.status === "pending" || p.status === "clarification_requested")
    .map((p) => ({
      id: `approval:${p.id}`,
      kind: "approval",
      division: divisionForRecommendationCategory(p.category),
      priority: p.urgency,
      title: p.description,
      detail: p.status === "clarification_requested" ? "Waiting on clarification before it can be decided." : p.riskIfDelayed,
      status: p.status,
      dueAt: p.expiresAt,
      href: "/approvals"
    }));

  const trackedWorkItems: WorkItem[] = trackedItems().map((t) => ({
    id: t.id,
    kind: "tracked",
    division: divisionForTrackedArea(t.area),
    priority: TRACKED_PRIORITY[t.category] ?? "normal",
    title: t.title,
    detail: `${TRACKED_CATEGORY_LABELS[t.category]} — ${t.detail}`,
    status: t.category,
    dueAt: t.dueAt,
    href: t.href
  }));

  const priorityRank: Record<WorkItem["priority"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return [...approvalItems, ...trackedWorkItems].sort((a, b) => {
    const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
    if (byPriority !== 0) return byPriority;
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });
}
