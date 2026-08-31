/**
 * Recommendation -> Approval -> Execution -> Verification.
 *
 * This is the core distinction the V2 spec calls out explicitly: an
 * approval must never be interpreted as successful execution. This module
 * derives, from a proposal's existing status, which of the four stages is
 * reached and how — so the UI can render them as separate, honest steps
 * instead of collapsing "approved" and "done" together.
 *
 * v1 has no live write adapter (src/integrations/mock-adapters.ts), so
 * every approval simulates execution and verification is therefore never
 * automatically "verified" — that's surfaced explicitly rather than
 * implied, so nobody mistakes a simulated run for a confirmed one.
 */

import type { ActionProposal, ProposalStatus } from "@/domain";

export type StageState = "done" | "current" | "pending" | "failed" | "skipped" | "not_applicable";

export interface StageStatus {
  key: "recommendation" | "approval" | "execution" | "verification";
  label: string;
  state: StageState;
  detail: string;
}

function approvalStage(status: ProposalStatus): StageStatus {
  switch (status) {
    case "pending":
      return { key: "approval", label: "Approval", state: "current", detail: "Awaiting a human decision." };
    case "clarification_requested":
      return { key: "approval", label: "Approval", state: "current", detail: "Clarification requested before deciding." };
    case "rejected":
      return { key: "approval", label: "Approval", state: "failed", detail: "Rejected — no execution will occur." };
    case "expired":
      return { key: "approval", label: "Approval", state: "skipped", detail: "Expired before a decision was made." };
    default:
      return { key: "approval", label: "Approval", state: "done", detail: "Approved by a human." };
  }
}

function executionStage(status: ProposalStatus): StageStatus {
  switch (status) {
    case "pending":
    case "clarification_requested":
    case "rejected":
    case "expired":
      return { key: "execution", label: "Execution", state: "pending", detail: "Not started — awaiting approval." };
    case "approved_simulation":
      return {
        key: "execution",
        label: "Execution",
        state: "done",
        detail: "Execution simulated — no live write adapter is enabled in this build."
      };
    case "executing":
      return { key: "execution", label: "Execution", state: "current", detail: "Executing now." };
    case "completed":
      return { key: "execution", label: "Execution", state: "done", detail: "Completed — no external write was required." };
    case "failed":
      return { key: "execution", label: "Execution", state: "failed", detail: "Execution failed — see Activity for recovery details." };
    default:
      return { key: "execution", label: "Execution", state: "pending", detail: "" };
  }
}

/**
 * Verification is deliberately never auto-marked "verified" by the act of
 * approving or simulating execution — v1 has no live write adapter to
 * confirm a real-world result against, so it stays explicitly "pending"
 * rather than silently implying success.
 */
function verificationStage(status: ProposalStatus): StageStatus {
  switch (status) {
    case "approved_simulation":
    case "executing":
      return {
        key: "verification",
        label: "Verification",
        state: "pending",
        detail: "Not yet possible to verify — no live write adapter is enabled in this build."
      };
    case "completed":
      return { key: "verification", label: "Verification", state: "not_applicable", detail: "Nothing external to verify." };
    case "failed":
      return { key: "verification", label: "Verification", state: "not_applicable", detail: "Execution failed before verification." };
    default:
      return { key: "verification", label: "Verification", state: "not_applicable", detail: "Not reached yet." };
  }
}

export function proposalStages(proposal: ActionProposal): StageStatus[] {
  return [
    { key: "recommendation", label: "Recommendation", state: "done", detail: "Cohen recommended this action." },
    approvalStage(proposal.status),
    executionStage(proposal.status),
    verificationStage(proposal.status)
  ];
}
