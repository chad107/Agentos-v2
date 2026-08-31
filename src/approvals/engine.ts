// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Approval state machine. Source: 05_PERMISSIONS_AND_APPROVALS.md,
 * 03_DASHBOARD_UX_SPEC.md "Approval states".
 *
 * pending -> approved -> executing -> completed
 * pending -> rejected
 * pending -> clarification_requested -> pending
 * approved -> failed (with recovery instructions)
 *
 * At launch, customer sends and orders remain `approved_simulation` until an
 * adapter is deliberately enabled (none are, in this demo — see
 * src/integrations/mock-adapters.ts, which implements no write capability).
 */

import type { ActionProposal, ApprovalDecision, ProposalStatus, UserRole } from "@/domain";
import { APPROVER_ROLES } from "@/domain";
import { isProhibitedActionType } from "./prohibited";
import { makeId } from "@/lib/ids";
import { now, toISO } from "@/lib/dates";

export class ApprovalPolicyError extends Error {}

/**
 * Guard used at proposal-creation time. No code path in this app should ever
 * be able to construct a `pending` proposal for a prohibited action type —
 * Cohen and specialist agents may only PROPOSE within the permitted classes.
 */
export function assertProposalIsPermitted(input: Pick<ActionProposal, "actionType" | "permissionClass">): void {
  if (input.permissionClass === "prohibited" || isProhibitedActionType(input.actionType)) {
    throw new ApprovalPolicyError(
      `Refusing to create a proposal for prohibited action type "${input.actionType}". ` +
        `AgentOS v1 authority is recommend_draft_approval; banking, deletion, legal commitments, ` +
        `system-setting changes and destructive/cyber-risky actions are never permitted.`
    );
  }
}

export function canUserApprove(role: UserRole, requiredRole: UserRole): boolean {
  if (!APPROVER_ROLES.includes(role)) return false;
  // v1: any approver-eligible role can act on any approver-gated proposal.
  // A future release may narrow this to an exact role match; tracked as an
  // open item rather than invented here (see BUILD_STATUS.md).
  void requiredRole;
  return true;
}

/**
 * Whether an approved proposal can execute live right now, or must fall back
 * to `approved_simulation`. In this build no write adapter is enabled
 * (src/integrations/mock-adapters.ts implements no MessageSender /
 * JobberWriter / QboBillWriter), so every approval simulates execution.
 */
function resolvePostApprovalStatus(proposal: ActionProposal): ProposalStatus {
  const hasLiveWriteAdapter = false; // Phase 6 (09_IMPLEMENTATION_PLAN.md) — intentionally off in v1.
  if (proposal.permissionClass === "execute_consequential" || proposal.permissionClass === "propose") {
    return hasLiveWriteAdapter ? "executing" : "approved_simulation";
  }
  // draft / analyze / read-class proposals have nothing external to execute.
  return "completed";
}

export interface DecisionResult {
  proposal: ActionProposal;
  decision: ApprovalDecision;
}

function assertActionable(proposal: ActionProposal): void {
  assertProposalIsPermitted(proposal);
  if (proposal.status !== "pending" && proposal.status !== "clarification_requested") {
    throw new ApprovalPolicyError(
      `Proposal ${proposal.id} is "${proposal.status}" and can no longer be decided.`
    );
  }
}

export function approveProposal(proposal: ActionProposal, userId: string): DecisionResult {
  assertActionable(proposal);
  const nextStatus = resolvePostApprovalStatus(proposal);
  const decided: ActionProposal = { ...proposal, status: nextStatus };
  const decision: ApprovalDecision = {
    id: makeId("dec"),
    proposalId: proposal.id,
    userId,
    decision: "approved",
    reason: null,
    editedPayload: null,
    decidedAt: toISO(now())
  };
  return { proposal: decided, decision };
}

export function editAndApproveProposal(
  proposal: ActionProposal,
  userId: string,
  editedPayload: Record<string, unknown>
): DecisionResult {
  assertActionable(proposal);
  if (!proposal.editable) {
    throw new ApprovalPolicyError(`Proposal ${proposal.id} does not allow edit-before-approval.`);
  }
  const nextStatus = resolvePostApprovalStatus(proposal);
  const decided: ActionProposal = { ...proposal, payload: editedPayload, status: nextStatus };
  const decision: ApprovalDecision = {
    id: makeId("dec"),
    proposalId: proposal.id,
    userId,
    decision: "edited_and_approved",
    reason: null,
    editedPayload,
    decidedAt: toISO(now())
  };
  return { proposal: decided, decision };
}

export function rejectProposal(proposal: ActionProposal, userId: string, reason: string): DecisionResult {
  assertActionable(proposal);
  if (!reason.trim()) {
    throw new ApprovalPolicyError("A reason is required to reject a proposal.");
  }
  const decided: ActionProposal = { ...proposal, status: "rejected" };
  const decision: ApprovalDecision = {
    id: makeId("dec"),
    proposalId: proposal.id,
    userId,
    decision: "rejected",
    reason,
    editedPayload: null,
    decidedAt: toISO(now())
  };
  return { proposal: decided, decision };
}

export function requestClarification(proposal: ActionProposal, userId: string, question: string): DecisionResult {
  assertActionable(proposal);
  const decided: ActionProposal = { ...proposal, status: "clarification_requested" };
  const decision: ApprovalDecision = {
    id: makeId("dec"),
    proposalId: proposal.id,
    userId,
    decision: "clarification_requested",
    reason: question,
    editedPayload: null,
    decidedAt: toISO(now())
  };
  return { proposal: decided, decision };
}

/** Cohen (or the requester) answers, returning the proposal to the queue. */
export function resolveClarification(proposal: ActionProposal): ActionProposal {
  if (proposal.status !== "clarification_requested") {
    throw new ApprovalPolicyError(`Proposal ${proposal.id} has no open clarification request.`);
  }
  return { ...proposal, status: "pending" };
}

export function isExpired(proposal: ActionProposal, reference: Date = now()): boolean {
  if (!proposal.expiresAt) return false;
  return new Date(proposal.expiresAt).getTime() < reference.getTime();
}
