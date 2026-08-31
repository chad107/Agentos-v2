// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Append-only audit trail. Source: 02_SYSTEM_ARCHITECTURE.md "Audit layer",
 * 05_PERMISSIONS_AND_APPROVALS.md "Audit" (never overwrite a historical
 * decision record; create revisions instead).
 *
 * This module exposes no update/delete function on purpose. In-memory here
 * for the demo; a production build would back this with an insert-only
 * table and forbid UPDATE/DELETE at the database grant level too.
 */

import type { AuditActorType, AuditEvent } from "@/domain";
import { makeId } from "@/lib/ids";
import { now, toISO } from "@/lib/dates";

const events: AuditEvent[] = [];

export function newCorrelationId(): string {
  return makeId("corr");
}

export interface RecordEventInput {
  actorType: AuditActorType;
  actorId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export function recordEvent(input: RecordEventInput): AuditEvent {
  const event: AuditEvent = {
    id: makeId("audit"),
    occurredAt: toISO(now()),
    actorType: input.actorType,
    actorId: input.actorId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
    correlationId: input.correlationId ?? newCorrelationId(),
    summary: input.summary
  };
  events.push(event);
  return event;
}

export interface AuditFilter {
  actorType?: AuditActorType;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  correlationId?: string;
  limit?: number;
}

export function listEvents(filter: AuditFilter = {}): AuditEvent[] {
  let result = events.slice().reverse(); // newest first
  if (filter.actorType) result = result.filter((e) => e.actorType === filter.actorType);
  if (filter.entityType) result = result.filter((e) => e.entityType === filter.entityType);
  if (filter.entityId) result = result.filter((e) => e.entityId === filter.entityId);
  if (filter.eventType) result = result.filter((e) => e.eventType === filter.eventType);
  if (filter.correlationId) result = result.filter((e) => e.correlationId === filter.correlationId);
  if (filter.limit) result = result.slice(0, filter.limit);
  return result;
}

/** Test/seed-only helper. Never exposed through the API layer. */
export function _resetAuditLogForTests(): void {
  events.length = 0;
}
