// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Minimal event -> workflow dispatch loop (01_MASTER_SPEC.md
 * "Event-driven orchestration": "Business events are published; policy
 * determines eligible workflows; the orchestrator routes work to the
 * correct manager/specialist agent"). This is the piece Milestone 9 was
 * missing: src/events/bus.ts could log events, and src/config/workflows.ts
 * could describe workflows, but nothing connected the two.
 *
 * Scope, honestly: this makes a *routing decision* (which active,
 * event-triggered workflow subscribes to this event type) and records it
 * to the audit trail — it does not execute the workflow's steps. Actually
 * running a workflow's steps would mean building real orchestration logic
 * for each of the 7 canonical workflows, which is out of scope here (see
 * BUILD_STATUS_V2.md "Remaining work").
 */

import type { EventEnvelope } from "@/domain/events";
import { WORKFLOWS } from "@/config/workflows";
import { recordEvent } from "@/audit/log";

export interface DispatchResult {
  eventId: string;
  matchedWorkflowKeys: string[];
}

export function dispatchEvent(event: EventEnvelope): DispatchResult {
  const matched = WORKFLOWS.filter(
    (w) => w.status === "active" && w.triggerType === "event" && w.triggerEventType === event.type
  );

  for (const workflow of matched) {
    recordEvent({
      actorType: "system",
      actorId: "workflow_dispatcher",
      eventType: "workflow.routed",
      entityType: "workflow",
      entityId: workflow.id,
      summary: `Routed a "${event.type}" event to workflow "${workflow.name}" (${workflow.ownerDivision} division).`,
      correlationId: event.correlationId,
      metadata: { eventId: event.id, workflowKey: workflow.key, subject: event.subject }
    });
  }

  return { eventId: event.id, matchedWorkflowKeys: matched.map((w) => w.key) };
}
