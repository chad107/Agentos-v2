import type { Agent, AgentId, AgentRun } from "@/domain";
import { getStore } from "@/data/store";

export function listAgents(): Agent[] {
  return getStore().agents;
}

export function getAgent(id: AgentId): Agent | undefined {
  return getStore().agents.find((a) => a.id === id);
}

export function runsForAgent(id: AgentId): AgentRun[] {
  return getStore().agentRuns.filter((r) => r.agentId === id);
}
