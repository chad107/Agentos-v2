// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { Agent, AgentId, AgentRun } from "@/domain";
import { getStore } from "@/data/store";
import { toISO, now } from "@/lib/dates";

export function listAgents(): Agent[] {
  return getStore().agents;
}

export function getAgent(id: AgentId): Agent | undefined {
  return getStore().agents.find((a) => a.id === id);
}

export function runsForAgent(id: AgentId): AgentRun[] {
  return getStore().agentRuns.filter((r) => r.agentId === id);
}

/**
 * Records a manually-triggered demo re-run (sets `status: "running"` and
 * refreshes `lastRunAt`). Moved here from the API route so the route never
 * touches `getStore()` directly — the repository layer is the only thing
 * route handlers/UI touch, per the Core/Dashboard boundary. Behavior is
 * unchanged from the prior inline implementation.
 */
export function markAgentRunTriggered(id: AgentId): Agent | undefined {
  const store = getStore();
  const idx = store.agents.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  const current = store.agents[idx];
  if (!current) return undefined;
  const updated: Agent = { ...current, lastRunAt: toISO(now()), status: "running" };
  store.agents[idx] = updated;
  return updated;
}
