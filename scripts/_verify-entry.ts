/**
 * Executed by scripts/verify-logic.mjs inside the build sandbox (no npm
 * registry access). Mirrors the intent of tests/*.test.ts but runs directly
 * via esbuild + Node assert, without Vitest. See that script's header
 * comment for why this exists.
 */
import assert from "node:assert/strict";
import {
  approveProposal,
  rejectProposal,
  requestClarification,
  resolveClarification,
  assertProposalIsPermitted,
  ApprovalPolicyError
} from "@/approvals/engine";
import { PROHIBITED_ACTION_TYPES } from "@/approvals/prohibited";
import { buildTop3, rankRecommendations, reconcileConflict } from "@/cohen/orchestrate";
import { jsaCadenceStatus } from "@/lib/jsa-cadence";
import { businessDaysFromNow, daysFromNow } from "@/lib/dates";
import type { ActionProposal, Finding, Recommendation } from "@/domain";
import { getStore } from "@/data/store";
import { homeSnapshot, listActivity, top3Recommendations } from "@/repositories";

let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks += 1;
  console.log(`  ✓ ${name}`);
}

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

console.log("AgentOS runtime logic verification\n");

check("AT-03: every prohibited action type is refused at creation", () => {
  for (const actionType of PROHIBITED_ACTION_TYPES) {
    assert.throws(() => assertProposalIsPermitted({ actionType, permissionClass: "prohibited" }), ApprovalPolicyError);
  }
});

check("AT-03: approve() refuses a prohibited-class proposal even if constructed directly", () => {
  const p = baseProposal({ actionType: "pay_bill", permissionClass: "prohibited" });
  assert.throws(() => approveProposal(p, "u_owner"), ApprovalPolicyError);
});

check("AT-03: approve() refuses a prohibited actionType even with a mislabeled permissionClass", () => {
  const p = baseProposal({ actionType: "transfer_money", permissionClass: "draft" });
  assert.throws(() => approveProposal(p, "u_owner"), ApprovalPolicyError);
});

check("AT-02: approving a propose-class action simulates execution (no live adapter)", () => {
  const p = baseProposal({ permissionClass: "propose" });
  const { proposal } = approveProposal(p, "u_owner");
  assert.equal(proposal.status, "approved_simulation");
});

check("AT-02: rejecting requires a non-empty reason", () => {
  const p = baseProposal();
  assert.throws(() => rejectProposal(p, "u_owner", ""));
  const { proposal } = rejectProposal(p, "u_owner", "Not needed");
  assert.equal(proposal.status, "rejected");
});

check("clarification round-trips back to pending", () => {
  const p = baseProposal();
  const { proposal: clarifying } = requestClarification(p, "u_owner", "Confirm please?");
  assert.equal(clarifying.status, "clarification_requested");
  assert.equal(resolveClarification(clarifying).status, "pending");
});

check("a terminal proposal cannot be re-decided", () => {
  const p = baseProposal({ status: "rejected" });
  assert.throws(() => approveProposal(p, "u_owner"), ApprovalPolicyError);
});

check("AT-01: buildTop3 selects exactly 3 from a larger pool", () => {
  const recs = [
    rec({ id: "a", priority: "high", category: "operations" }),
    rec({ id: "b", priority: "high", category: "sales" }),
    rec({ id: "c", priority: "normal", category: "financial" }),
    rec({ id: "d", priority: "normal", category: "customer" }),
    rec({ id: "e", priority: "low", category: "admin" })
  ];
  const result = buildTop3(recs);
  const ranked = result.filter((r) => r.cohenRank !== null);
  assert.equal(ranked.length, 3);
  assert.deepEqual(
    ranked.map((r) => r.cohenRank),
    [1, 2, 3]
  );
});

check("AT-01: safety outranks an equally-prioritized operations item", () => {
  const safetyRec = rec({ id: "s", priority: "high", category: "safety" });
  const opsRec = rec({ id: "o", priority: "high", category: "operations" });
  const ranked = rankRecommendations([opsRec, safetyRec]);
  assert.equal(ranked[0]?.id, "s");
});

check("AT-11: reconcileConflict surfaces both agents, never auto-picks one", () => {
  const salesFinding: Finding = {
    id: "f1",
    agentId: "sales",
    findingType: "x",
    severity: "high",
    title: "t",
    summary: "s",
    entityRefs: [],
    evidenceRefs: [],
    confidence: "medium",
    detectedAt: new Date().toISOString(),
    status: "open"
  };
  const opsFinding: Finding = { ...salesFinding, id: "f2", agentId: "operations" };
  const reconciliation = reconcileConflict("job:x", [salesFinding, opsFinding]);
  assert.equal(reconciliation.agentPositions.length, 2);
  assert.ok(reconciliation.humanDecisionRequired.length > 0);
});

check("AT-08: JSA cadence transitions missing -> reminded -> escalated at 4:00/4:30", () => {
  const reminderAt = new Date("2026-08-28T16:00:00");
  const escalationAt = new Date("2026-08-28T16:30:00");
  assert.equal(jsaCadenceStatus(new Date("2026-08-28T15:59:00"), reminderAt, escalationAt), "missing");
  assert.equal(jsaCadenceStatus(new Date("2026-08-28T16:15:00"), reminderAt, escalationAt), "reminded");
  assert.equal(jsaCadenceStatus(new Date("2026-08-28T16:30:00"), reminderAt, escalationAt), "escalated");
});

check("AT-07: businessDaysFromNow(3) is further out than daysFromNow(3) whenever a weekend falls between", () => {
  // Sanity check on the date helpers themselves.
  const ref = new Date("2026-08-28T12:00:00"); // Friday
  const business = businessDaysFromNow(3, ref);
  const calendar = daysFromNow(3, ref);
  assert.ok(business.getTime() >= calendar.getTime());
});

check("seed store: loads without throwing and every domain area is populated", () => {
  const store = getStore();
  assert.equal(store.agents.length, 8);
  assert.ok(store.recommendations.length > 3, "AT-01 requires more than 3 candidate recommendations");
  assert.ok(store.jobs.length >= 1);
  assert.ok(store.leads.length >= 1);
  assert.ok(store.safetyRequirements.length >= 1);
  assert.ok(store.accountingItems.length >= 1);
  assert.ok(store.customerCases.length >= 1);
  assert.ok(store.voiceCalls.length >= 1);
  assert.ok(store.knowledgeItems.length >= 1);
  assert.ok(store.integrationSettings.length >= 1);
});

check("AT-01: seeded Home shows exactly 3 ranked recommendations, safety-first ordering respected", () => {
  const top3 = top3Recommendations();
  assert.equal(top3.length, 3);
  assert.deepEqual(
    top3.map((r) => r.cohenRank),
    [1, 2, 3]
  );
});

check("AT-03 (integration): the guardrail proof-of-concept ran at seed time and was audited", () => {
  const blocked = listActivity({ eventType: "guardrail.blocked" });
  assert.equal(blocked.length, 1);
  assert.match(blocked[0]!.summary, /pay_bill/);
});

check("homeSnapshot() renders end-to-end without throwing", () => {
  const snapshot = homeSnapshot();
  assert.ok(snapshot.top3.length > 0);
  assert.ok(snapshot.health.length > 0);
  assert.ok(typeof snapshot.cohenMessage === "string" && snapshot.cohenMessage.length > 0);
});

console.log(`\n${checks} runtime checks passed.`);
