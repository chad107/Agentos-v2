// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Event envelope + workflow registry types. Source: 01_MASTER_SPEC.md
 * "Event-driven orchestration", "Event envelope example", "Canonical event
 * examples". A minimal in-memory bus (src/events/bus.ts) implements this;
 * it does not replace src/cohen/orchestrate.ts's existing ranking logic.
 */

export const CANONICAL_EVENT_TYPES = [
  "lead.created",
  "quote.created",
  "quote.accepted",
  "deposit.received",
  "job.scheduled",
  "job.readiness_due",
  "shipment.updated",
  "job.completed",
  "closeout.missing",
  "invoice.received",
  "bill.due_soon",
  "payment.received",
  "jsa.due",
  "jsa.missing",
  "review.received",
  "competitor.promotion_detected",
  "campaign.draft_ready",
  "approval.requested",
  "approval.resolved",
  "risk.detected"
] as const;
export type CanonicalEventType = (typeof CANONICAL_EVENT_TYPES)[number];

export interface EventEnvelope {
  id: string;
  tenantId: string;
  type: CanonicalEventType | (string & {});
  occurredAt: string;
  source: string;
  subject: { type: string; id: string };
  correlationId: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
}

export type WorkflowTriggerType = "event" | "schedule" | "manual";

export interface WorkflowVersion {
  version: number;
  createdAt: string;
  changeSummary: string;
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  triggerEventType: CanonicalEventType | null;
  ownerDivision: string;
  versions: WorkflowVersion[];
  currentVersion: number;
  status: "active" | "inactive";
}
