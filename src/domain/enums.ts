/**
 * Canonical status/priority/permission enums shared across the domain model.
 * Source: 05_PERMISSIONS_AND_APPROVALS.md, 07_DATA_MODEL.md, 11_UI_COPY_AND_STATES.md
 */

export const PRIORITY_LEVELS = ["urgent", "high", "normal", "low"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const RECOMMENDATION_CATEGORIES = [
  "safety",
  "financial",
  "customer",
  "operations",
  "sales",
  "admin"
] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

/** Default cross-agent priority order. Lower index = higher priority. Safety always wins. */
export const CATEGORY_PRIORITY_ORDER: RecommendationCategory[] = [
  "safety",
  "financial",
  "customer",
  "operations",
  "sales",
  "admin"
];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_COPY: Record<ConfidenceLevel, string> = {
  high: "High — corroborated by multiple current source records.",
  medium: "Medium — evidence is useful but incomplete or stale.",
  low: "Low — material facts are missing; clarification recommended."
};

export const RECOMMENDATION_STATUSES = [
  "new",
  "surfaced",
  "acknowledged",
  "action_pending",
  "resolved",
  "dismissed"
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

/**
 * Permission classes. See 05_PERMISSIONS_AND_APPROVALS.md.
 * `execute_low_risk` is disabled by default at launch (Level 2 authority).
 * `prohibited` must never resolve to `approved` — enforced in src/approvals/engine.ts.
 */
export const PERMISSION_CLASSES = [
  "read",
  "analyze",
  "draft",
  "propose",
  "execute_low_risk",
  "execute_consequential",
  "prohibited"
] as const;
export type PermissionClass = (typeof PERMISSION_CLASSES)[number];

export const PROPOSAL_STATUSES = [
  "pending",
  "clarification_requested",
  "approved",
  "approved_simulation",
  "executing",
  "completed",
  "rejected",
  "failed",
  "expired"
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const JOB_READINESS_STATUSES = [
  "unknown",
  "needs_review",
  "blocked",
  "at_risk",
  "ready",
  "in_progress",
  "closeout_missing",
  "complete"
] as const;
export type JobReadinessStatus = (typeof JOB_READINESS_STATUSES)[number];

export const AGENT_STATUSES = [
  "idle",
  "monitoring",
  "running",
  "blocked",
  "needs_human",
  "degraded",
  "paused"
] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const AGENT_STATUS_COPY: Record<AgentStatus, string> = {
  idle: "Idle",
  monitoring: "Monitoring",
  running: "Working",
  blocked: "Blocked",
  needs_human: "Needs human",
  degraded: "Degraded",
  paused: "Paused"
};

export const USER_ROLES = [
  "owner",
  "operator",
  "administrator",
  "install_manager",
  "staff",
  "read_only"
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Roles authorized to decide an approval, by default. Individual proposals may
 * further narrow this via `approverRole`. Staff/read-only can never approve.
 */
export const APPROVER_ROLES: UserRole[] = ["owner", "operator", "administrator", "install_manager"];

export const AUDIT_ACTOR_TYPES = ["human", "agent", "cohen", "system"] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["push", "in_app", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const IMPACT_TYPES = ["revenue", "time", "risk", "customer", "safety", "financial"] as const;
export type ImpactType = (typeof IMPACT_TYPES)[number];
