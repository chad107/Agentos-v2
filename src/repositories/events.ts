// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import { listEvents } from "@/events/bus";
import type { EventEnvelope } from "@/domain/events";

export function recentEvents(limit = 20): EventEnvelope[] {
  return listEvents({ limit });
}
