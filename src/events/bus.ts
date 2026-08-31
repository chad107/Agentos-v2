/**
 * Minimal in-memory event bus implementing the event envelope contract
 * (src/domain/events.ts, 01_MASTER_SPEC.md "Event-driven orchestration").
 *
 * This does not replace src/cohen/orchestrate.ts's ranking logic or
 * src/audit/log.ts's audit trail — it is the new canonical-event log a
 * future workflow orchestrator (Milestone 9's remaining work: routing
 * published events to registered workflows) would consume. Wired into one
 * real call site today (approval resolution, src/repositories/approvals.ts)
 * rather than left unused — an event bus nothing ever publishes to isn't a
 * verified capability.
 */

import type { CanonicalEventType, EventEnvelope } from "@/domain/events";
import { makeId } from "@/lib/ids";
import { now, toISO } from "@/lib/dates";
import { getCurrentTenant } from "@/lib/tenant-context";

const events: EventEnvelope[] = [];

export interface PublishEventInput {
  type: CanonicalEventType | (string & {});
  source: string;
  subject: { type: string; id: string };
  correlationId: string;
  payload?: Record<string, unknown>;
}

export function publishEvent(input: PublishEventInput): EventEnvelope {
  const event: EventEnvelope = {
    id: makeId("evt"),
    tenantId: getCurrentTenant().id,
    type: input.type,
    occurredAt: toISO(now()),
    source: input.source,
    subject: input.subject,
    correlationId: input.correlationId,
    payload: input.payload ?? {},
    schemaVersion: 1
  };
  events.push(event);
  return event;
}

export function listEvents(filter?: { type?: string; correlationId?: string; limit?: number }): EventEnvelope[] {
  const matched = events.filter((e) => {
    if (filter?.type && e.type !== filter.type) return false;
    if (filter?.correlationId && e.correlationId !== filter.correlationId) return false;
    return true;
  });
  const sorted = matched.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return filter?.limit ? sorted.slice(0, filter.limit) : sorted;
}
