/**
 * Progressive-trust / risk-tier governance types.
 * Source: 01_MASTER_SPEC.md "Governance, approvals, progressive trust".
 *
 * These types model policy; they do not change runtime behavior on their
 * own. The approval-first default (src/approvals/engine.ts) stays exactly
 * as-is — no agent in this build auto-executes a consequential action
 * regardless of the trust state recorded here (CLAUDE.md non-negotiable
 * #6: "Restricted/high-impact actions cannot bypass approvals").
 */

import type { AgentId } from "./entities";
import type { DivisionKey } from "./platform";

export const RISK_TIERS = [0, 1, 2, 3, 4] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const RISK_TIER_LABELS: Record<RiskTier, string> = {
  0: "Tier 0 — Informational",
  1: "Tier 1 — Low-risk, reversible",
  2: "Tier 2 — Moderate, external/reversible",
  3: "Tier 3 — High-impact",
  4: "Tier 4 — Restricted"
};

export const RISK_TIER_DESCRIPTIONS: Record<RiskTier, string> = {
  0: "Read / analyze / summarize. Auto.",
  1: "Draft / classify / internal metadata / reminders. Auto after trust; otherwise shadow/approval.",
  2: "Routine communications, permitted non-financial records/scheduling. Policy-dependent approval.",
  3: "Strategic pricing, contractual/customer commitments, consequential publishing, sensitive HR/compliance. Human approval unless explicit future policy changes it.",
  4: "Money movement/bank payments, destructive irreversible actions, actions outside legal/credential scope. Blocked by default."
};

export const TRUST_STATES = ["shadow", "supervised", "guarded_auto", "trusted_auto"] as const;
export type TrustState = (typeof TRUST_STATES)[number];

export const TRUST_STATE_LABELS: Record<TrustState, string> = {
  shadow: "Shadow",
  supervised: "Supervised",
  guarded_auto: "Guarded auto",
  trusted_auto: "Trusted auto"
};

export const TRUST_STATE_DESCRIPTIONS: Record<TrustState, string> = {
  shadow: "Agent proposes; every action is reviewed before anything reaches a human as a recommendation.",
  supervised: "Agent proposes; a human approves or rejects each action before it takes effect.",
  guarded_auto: "Agent may auto-execute low-risk actions inside tight guardrails; higher-risk actions still require approval.",
  trusted_auto: "Agent auto-executes within its risk tier after demonstrated reliability; still logged and auditable."
};

/**
 * Standard Agent Contract fields not carried by the v1 `Agent` entity
 * (src/domain/entities.ts), added as a separate registry rather than
 * changing that entity's shape — v1 code/tests/seed data that already
 * depend on `Agent` are untouched. Source: 01_MASTER_SPEC.md
 * "Standard Agent Contract".
 */
export interface AgentRegistryEntry {
  agentId: AgentId;
  divisionKey: DivisionKey;
  version: string;
  riskTier: RiskTier;
  trustState: TrustState;
  /** Honest, code-derived rationale — not invented. */
  trustRationale: string;
  capabilities: string[];
  subscribedEvents: string[];
  emittedEvents: string[];
  requiredPermissions: string[];
  kpiMappings: string[];
  knowledgeScopes: string[];
  escalationTarget: string;
  accountableHumanRole: string;
}

/**
 * Promotion/demotion criteria are policy text, not stored per-agent data —
 * no agent in this build has run enough real executions to have promotion
 * metrics (01_MASTER_SPEC.md: "minimum sample size, success rate, low
 * override/error rate, no unresolved critical incidents"). Fabricating
 * sample counts would violate "Do not fabricate".
 */
export const PROMOTION_CRITERIA = [
  "Minimum sample size of completed executions at the current trust state",
  "Success rate above the division's configured threshold",
  "Low human-override / correction rate",
  "Low error rate",
  "No unresolved critical incidents"
];

export const DEMOTION_TRIGGERS = [
  "A material failure (wrong action taken or proposed with high confidence)",
  "A policy violation (e.g. a proposal that should have been blocked as prohibited)",
  "A sustained rise in human override/correction rate"
];
