import type { ActionProposal, ProposalStatus } from "@/domain";
import { getStore } from "@/data/store";
import {
  approveProposal,
  editAndApproveProposal,
  rejectProposal,
  requestClarification,
  ApprovalPolicyError
} from "@/approvals/engine";
import { recordEvent, newCorrelationId } from "@/audit/log";
import { updateRecommendationStatus } from "./recommendations";

export function listProposals(filter?: { status?: ProposalStatus }): ActionProposal[] {
  const all = getStore().actionProposals;
  if (filter?.status) return all.filter((p) => p.status === filter.status);
  return all;
}

export function getProposal(id: string): ActionProposal | undefined {
  return getStore().actionProposals.find((p) => p.id === id);
}

function persist(updated: ActionProposal): void {
  const store = getStore();
  const idx = store.actionProposals.findIndex((p) => p.id === updated.id);
  if (idx !== -1) store.actionProposals[idx] = updated;
}

function afterDecision(proposal: ActionProposal, correlationId: string): void {
  // A decision on the last open proposal for a recommendation resolves it;
  // Cohen re-ranks so Home always reflects the current state (AT-01/AT-14).
  const store = getStore();
  const siblings = store.actionProposals.filter((p) => p.recommendationId === proposal.recommendationId);
  const stillOpen = siblings.some((p) => p.status === "pending" || p.status === "clarification_requested");
  if (!stillOpen) {
    const nextStatus = proposal.status === "rejected" ? "dismissed" : "resolved";
    updateRecommendationStatus(proposal.recommendationId, nextStatus);
    recordEvent({
      actorType: "cohen",
      actorId: "cohen",
      eventType: "cohen.recommendation_updated",
      entityType: "recommendation",
      entityId: proposal.recommendationId,
      summary: `Recommendation status set to "${nextStatus}" following an approval decision.`,
      correlationId
    });
  }
}

export interface DecisionOutcome {
  ok: true;
  proposal: ActionProposal;
}
export interface DecisionError {
  ok: false;
  error: string;
}

export function decideApprove(id: string, userId: string): DecisionOutcome | DecisionError {
  const proposal = getProposal(id);
  if (!proposal) return { ok: false, error: "Proposal not found." };
  try {
    const correlationId = newCorrelationId();
    const { proposal: decided } = approveProposal(proposal, userId);
    persist(decided);
    recordEvent({
      actorType: "human",
      actorId: userId,
      eventType: "approval.decided",
      entityType: "action_proposal",
      entityId: decided.id,
      summary: `Approved: ${decided.description}`,
      metadata: { resultStatus: decided.status },
      correlationId
    });
    if (decided.status === "approved_simulation" || decided.status === "completed") {
      recordEvent({
        actorType: "system",
        actorId: "approval_engine",
        eventType: "action.completed",
        entityType: "action_proposal",
        entityId: decided.id,
        summary:
          decided.status === "approved_simulation"
            ? "Execution simulated — no live write adapter is enabled in this build."
            : "Completed — no external write was required.",
        correlationId
      });
    }
    afterDecision(decided, correlationId);
    return { ok: true, proposal: decided };
  } catch (err) {
    if (err instanceof ApprovalPolicyError) return { ok: false, error: err.message };
    throw err;
  }
}

export function decideEditAndApprove(
  id: string,
  userId: string,
  editedPayload: Record<string, unknown>
): DecisionOutcome | DecisionError {
  const proposal = getProposal(id);
  if (!proposal) return { ok: false, error: "Proposal not found." };
  try {
    const correlationId = newCorrelationId();
    const { proposal: decided } = editAndApproveProposal(proposal, userId, editedPayload);
    persist(decided);
    recordEvent({
      actorType: "human",
      actorId: userId,
      eventType: "approval.decided",
      entityType: "action_proposal",
      entityId: decided.id,
      summary: `Edited and approved: ${decided.description}`,
      metadata: { resultStatus: decided.status, editedPayload },
      correlationId
    });
    afterDecision(decided, correlationId);
    return { ok: true, proposal: decided };
  } catch (err) {
    if (err instanceof ApprovalPolicyError) return { ok: false, error: err.message };
    throw err;
  }
}

export function decideReject(id: string, userId: string, reason: string): DecisionOutcome | DecisionError {
  const proposal = getProposal(id);
  if (!proposal) return { ok: false, error: "Proposal not found." };
  try {
    const correlationId = newCorrelationId();
    const { proposal: decided } = rejectProposal(proposal, userId, reason);
    persist(decided);
    recordEvent({
      actorType: "human",
      actorId: userId,
      eventType: "approval.decided",
      entityType: "action_proposal",
      entityId: decided.id,
      summary: `Rejected: ${decided.description}`,
      metadata: { reason },
      correlationId
    });
    afterDecision(decided, correlationId);
    return { ok: true, proposal: decided };
  } catch (err) {
    if (err instanceof ApprovalPolicyError) return { ok: false, error: err.message };
    throw err;
  }
}

export function decideClarify(id: string, userId: string, question: string): DecisionOutcome | DecisionError {
  const proposal = getProposal(id);
  if (!proposal) return { ok: false, error: "Proposal not found." };
  try {
    const correlationId = newCorrelationId();
    const { proposal: decided } = requestClarification(proposal, userId, question);
    persist(decided);
    recordEvent({
      actorType: "human",
      actorId: userId,
      eventType: "approval.clarification_requested",
      entityType: "action_proposal",
      entityId: decided.id,
      summary: `Clarification requested: ${question}`,
      correlationId
    });
    return { ok: true, proposal: decided };
  } catch (err) {
    if (err instanceof ApprovalPolicyError) return { ok: false, error: err.message };
    throw err;
  }
}
