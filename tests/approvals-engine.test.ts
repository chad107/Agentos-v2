import { describe, expect, it } from "vitest";
import {
  approveProposal,
  editAndApproveProposal,
  rejectProposal,
  requestClarification,
  resolveClarification,
  assertProposalIsPermitted,
  canUserApprove,
  ApprovalPolicyError
} from "@/approvals/engine";
import { isProhibitedActionType, PROHIBITED_ACTION_TYPES } from "@/approvals/prohibited";
import type { ActionProposal } from "@/domain";

function baseProposal(overrides: Partial<ActionProposal> = {}): ActionProposal {
  return {
    id: "prop_test",
    recommendationId: "rec_test",
    actionType: "customer_followup_message_draft",
    description: "Draft a follow-up email.",
    initiatorAgentId: "sales",
    targetRef: "jobber:quote_1",
    payload: { channel: "email", body: "Hi there" },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "pending",
    evidenceRefs: ["jobber:quote_1"],
    confidence: "medium",
    urgency: "normal",
    riskIfDelayed: "Opportunity may cool.",
    editable: true,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    category: "sales",
    ...overrides
  };
}

describe("AT-03 — prohibited actions can never be created or approved", () => {
  it("refuses to create a proposal for every prohibited action type", () => {
    for (const actionType of PROHIBITED_ACTION_TYPES) {
      expect(() => assertProposalIsPermitted({ actionType, permissionClass: "prohibited" })).toThrow(ApprovalPolicyError);
    }
  });

  it("refuses to approve a proposal whose permissionClass is prohibited, even if one somehow exists", () => {
    const proposal = baseProposal({ actionType: "pay_bill", permissionClass: "prohibited" });
    expect(() => approveProposal(proposal, "u_owner")).toThrow(ApprovalPolicyError);
  });

  it("refuses to approve a proposal whose actionType is prohibited even if permissionClass was mislabeled", () => {
    // Defense in depth: the actionType check catches what a bad permissionClass might miss.
    const proposal = baseProposal({ actionType: "transfer_money", permissionClass: "draft" });
    expect(() => approveProposal(proposal, "u_owner")).toThrow(ApprovalPolicyError);
  });

  it("isProhibitedActionType agrees with the canonical list", () => {
    expect(isProhibitedActionType("pay_bill")).toBe(true);
    expect(isProhibitedActionType("customer_followup_message_draft")).toBe(false);
  });
});

describe("AT-02 — approval gating: nothing executes live in this build", () => {
  it("moves a draft proposal to approved_simulation on approve (no live write adapter enabled)", () => {
    const proposal = baseProposal({ permissionClass: "propose" });
    const { proposal: decided, decision } = approveProposal(proposal, "u_owner");
    expect(decided.status).toBe("approved_simulation");
    expect(decision.decision).toBe("approved");
    expect(decision.userId).toBe("u_owner");
  });

  it("a plain draft/analyze-class proposal completes without any external execution", () => {
    const proposal = baseProposal({ permissionClass: "draft", actionType: "qbo_bill_prep_review" });
    const { proposal: decided } = approveProposal(proposal, "u_owner");
    expect(decided.status).toBe("completed");
  });

  it("supports edit-before-approve for editable draft content", () => {
    const proposal = baseProposal({ editable: true });
    const { proposal: decided, decision } = editAndApproveProposal(proposal, "u_tanya", { body: "Edited body" });
    expect(decided.payload.body).toBe("Edited body");
    expect(decision.decision).toBe("edited_and_approved");
  });

  it("refuses edit-before-approve when the proposal is not editable", () => {
    const proposal = baseProposal({ editable: false });
    expect(() => editAndApproveProposal(proposal, "u_tanya", { body: "x" })).toThrow(ApprovalPolicyError);
  });

  it("requires a non-empty reason to reject", () => {
    const proposal = baseProposal();
    expect(() => rejectProposal(proposal, "u_owner", "")).toThrow(ApprovalPolicyError);
    const { proposal: decided } = rejectProposal(proposal, "u_owner", "Not needed.");
    expect(decided.status).toBe("rejected");
  });

  it("clarification requests return the proposal to pending once resolved", () => {
    const proposal = baseProposal();
    const { proposal: clarifying } = requestClarification(proposal, "u_owner", "Is this urgent?");
    expect(clarifying.status).toBe("clarification_requested");
    const resolved = resolveClarification(clarifying);
    expect(resolved.status).toBe("pending");
  });

  it("refuses to decide a proposal that is already terminal", () => {
    const proposal = baseProposal({ status: "rejected" });
    expect(() => approveProposal(proposal, "u_owner")).toThrow(ApprovalPolicyError);
  });
});

describe("canUserApprove — role gate (found wired into no API route by a Milestone 12 security review; now wired into POST /api/approvals/:id/{approve,reject,clarify})", () => {
  it("allows every approver-eligible role", () => {
    for (const role of ["owner", "operator", "administrator", "install_manager"] as const) {
      expect(canUserApprove(role, "administrator")).toBe(true);
    }
  });

  it("refuses staff and read_only, regardless of the proposal's required role", () => {
    expect(canUserApprove("staff", "administrator")).toBe(false);
    expect(canUserApprove("read_only", "administrator")).toBe(false);
  });
});
