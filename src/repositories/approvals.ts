import type { ActionProposal, ApprovalDecision, ProposalStatus } from "@/domain";
import { getStore } from "@/data/store";
import {
  approveProposal,
  editAndApproveProposal,
  rejectProposal,
  requestClarification,
  ApprovalPolicyError
} from "@/approvals/engine";
import { recordEvent, newCorrelationId } from "@/audit/log";
import { publishEvent } from "@/events/bus";
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

/**
 * Persists the `ApprovalDecision` record the approval engine returns
 * alongside the updated proposal. Previously discarded at each call site —
 * only seed-time decisions were ever visible in `store.approvalDecisions`,
 * so nothing decided at runtime showed up in decision/audit history beyond
 * the append-only audit log. Fixed here so decision memory
 * (src/repositories/decisions.ts) reflects real runtime decisions too.
 */
function persistDecision(decision: ApprovalDecision): void {
  getStore().approvalDecisions.push(decision);
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
    const { proposal: decided, decision } = approveProposal(proposal, userId);
    persist(decided);
    persistDecision(decision);
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
    publishEvent({
      type: "approval.resolved",
      source: "approval_engine",
      subject: { type: "action_proposal", id: decided.id },
      correlationId,
      payload: { status: decided.status, decision: "approved" }
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
    const { proposal: decided, decision } = editAndApproveProposal(proposal, userId, editedPayload);
    persist(decided);
    persistDecision(decision);
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
    publishEvent({
      type: "approval.resolved",
      source: "approval_engine",
      subject: { type: "action_proposal", id: decided.id },
      correlationId,
      payload: { status: decided.status, decision: "edited_and_approved" }
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
    const { proposal: decided, decision } = rejectProposal(proposal, userId, reason);
    persist(decided);
    persistDecision(decision);
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
    publishEvent({
      type: "approval.resolved",
      source: "approval_engine",
      subject: { type: "action_proposal", id: decided.id },
      correlationId,
      payload: { status: decided.status, decision: "rejected", reason }
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
    const { proposal: decided, decision } = requestClarification(proposal, userId, question);
    persist(decided);
    persistDecision(decision);
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
