/**
 * Decision/outcome memory (01_MASTER_SPEC.md "Institutional memory").
 * Decisions are derived from real `ApprovalDecision` + `ActionProposal`
 * records already in the store (src/data/store.ts) — not fabricated
 * seed data. Every outcome starts `pending_measurement`: this build has no
 * outcome-tracking data source, so no actual-outcome or lesson is ever
 * invented (01_MASTER_SPEC.md "Do not fabricate"; "Observed outcomes never
 * silently rewrite policy").
 */

import type { Decision, Outcome } from "@/domain/memory";
import { getStore } from "@/data/store";
import { getCurrentTenant } from "@/lib/tenant-context";

export function listDecisions(): Decision[] {
  const store = getStore();
  const tenantId = getCurrentTenant().id;
  return store.approvalDecisions
    .filter((d) => d.decision === "approved" || d.decision === "edited_and_approved" || d.decision === "rejected")
    .map((d) => {
      const proposal = store.actionProposals.find((p) => p.id === d.proposalId);
      return {
        id: `decision:${d.id}`,
        tenantId,
        title: proposal?.description ?? `Proposal ${d.proposalId}`,
        context: proposal?.riskIfDelayed ?? "No context recorded.",
        alternativesConsidered: [],
        rationale: d.reason ?? (d.decision === "rejected" ? "Rejected without a recorded reason." : "Approved as proposed."),
        approverUserId: d.userId,
        linkedProposalId: d.proposalId,
        expectedOutcome: proposal?.impact?.label ?? "No expected impact recorded on the proposal.",
        decidedAt: d.decidedAt
      } satisfies Decision;
    })
    .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
}

export function getDecision(id: string): Decision | undefined {
  return listDecisions().find((d) => d.id === id);
}

/** Every decision starts unmeasured — no outcome-tracking data source exists yet in this build. */
export function outcomeForDecision(decision: Decision): Outcome {
  return {
    id: `outcome:${decision.id}`,
    decisionId: decision.id,
    status: "pending_measurement",
    actualOutcome: null,
    measuredAt: null,
    lesson: null,
    proposedKnowledgeUpdate: null
  };
}
