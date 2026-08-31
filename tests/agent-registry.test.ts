import { describe, expect, it } from "vitest";
import { AGENT_REGISTRY, AGENT_IDS, getAgentRegistryEntry } from "@/config/agent-registry";
import { listAgents } from "@/repositories/agents";
import { getDivisionConfig } from "@/config/divisions";

describe("Agent Registry V2 contract (01_MASTER_SPEC.md 'Standard Agent Contract')", () => {
  it("has exactly one registry entry per seeded v1 agent", () => {
    const seededAgents = listAgents();
    expect(seededAgents.map((a) => a.id).sort()).toEqual([...AGENT_IDS].sort());
    for (const agent of seededAgents) {
      expect(getAgentRegistryEntry(agent.id)).toBeDefined();
    }
  });

  it("maps every registry entry to a real division in the registry", () => {
    for (const entry of AGENT_REGISTRY) {
      expect(getDivisionConfig(entry.divisionKey)).toBeDefined();
    }
  });

  it("never classifies an agent as trusted_auto — no agent in this build has a real execution-history sample to justify it", () => {
    for (const entry of AGENT_REGISTRY) {
      expect(entry.trustState).not.toBe("trusted_auto");
    }
  });

  it("never assigns risk tier 4 (restricted) to any agent — money movement/destructive actions stay outside every agent's contract", () => {
    for (const entry of AGENT_REGISTRY) {
      expect(entry.riskTier).not.toBe(4);
    }
  });
});
