// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Four-layer memory + decision/outcome types. Source: 01_MASTER_SPEC.md
 * "Memory and knowledge". Additive alongside the existing v1
 * `KnowledgeItem` (src/domain/entities.ts), which stays as-is — this adds
 * the scope/provenance/classification dimensions the v1 Knowledge page
 * doesn't yet carry, without breaking it.
 */

export const KNOWLEDGE_SCOPES = ["global", "company", "division", "executive"] as const;
export type KnowledgeScopeType = (typeof KNOWLEDGE_SCOPES)[number];

export const KNOWLEDGE_SCOPE_LABELS: Record<KnowledgeScopeType, string> = {
  global: "Global platform",
  company: "Company",
  division: "Division",
  executive: "Executive / personal preference"
};

export const KNOWLEDGE_CLASSIFICATIONS = [
  "policy",
  "verified_fact",
  "assumption",
  "hypothesis",
  "decision",
  "lesson"
] as const;
export type KnowledgeClassification = (typeof KNOWLEDGE_CLASSIFICATIONS)[number];

/**
 * Institutional memory record. Source: 01_MASTER_SPEC.md "Institutional
 * memory: important decisions store context, alternatives, rationale,
 * approver, expected outcome, actual outcome, lessons." Observed outcomes
 * never silently rewrite policy — a lesson becomes a *proposed* knowledge
 * update, reviewed like anything else, not an automatic edit.
 */
export interface Decision {
  id: string;
  tenantId: string;
  title: string;
  context: string;
  alternativesConsidered: string[];
  rationale: string;
  approverUserId: string;
  linkedProposalId: string | null;
  expectedOutcome: string;
  decidedAt: string;
}

export type OutcomeStatus = "pending_measurement" | "measured" | "not_measurable";

export interface Outcome {
  id: string;
  decisionId: string;
  status: OutcomeStatus;
  actualOutcome: string | null;
  measuredAt: string | null;
  lesson: string | null;
  /** A lesson becomes a *proposed* knowledge update — never applied silently. */
  proposedKnowledgeUpdate: string | null;
}
