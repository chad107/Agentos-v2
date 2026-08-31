import { listAgents, runsForAgent } from "@/repositories";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/Badge";
import { AgentRunButton } from "@/components/agents/AgentRunButton";
import { AGENT_STATUS_COPY } from "@/domain";

const toneFor: Record<string, "good" | "attention" | "urgent" | "info"> = {
  idle: "info",
  monitoring: "good",
  running: "info",
  blocked: "urgent",
  needs_human: "attention",
  degraded: "attention",
  paused: "info"
};

export default function AgentsPage() {
  const agents = listAgents();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Agent Centre</h1>
        <p className="text-sm text-ink-500">
          Specialist agents are policy-and-workflow modules — not independent chatbots. Each reports to Cohen.
        </p>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => {
          const runs = runsForAgent(agent.id).slice(0, 3);
          return (
            <Card key={agent.id}>
              <CardHeader>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-base font-semibold text-ink-900">{agent.name}</h2>
                    <StatusPill tone={toneFor[agent.status] ?? "info"}>{AGENT_STATUS_COPY[agent.status]}</StatusPill>
                  </div>
                  <p className="text-sm text-ink-500">{agent.mission}</p>
                </div>
                <AgentRunButton agentId={agent.id} />
              </CardHeader>
              <CardBody className="grid gap-3 pt-0 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-ink-400">Reads</p>
                  <p className="text-sm text-ink-700">{agent.systemsRead.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-400">Writes</p>
                  <p className="text-sm text-ink-700">{agent.systemsWrite.join(", ") || "None (draft/propose only)"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-400">Schedules</p>
                  <p className="text-sm text-ink-700">{agent.schedules.join("; ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-400">Current task</p>
                  <p className="text-sm text-ink-700">{agent.currentTask ?? "None"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-400">Open findings</p>
                  <p className="text-sm text-ink-700">{agent.openFindingsCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-400">Last run</p>
                  <p className="text-sm text-ink-700">{agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : "Never"}</p>
                </div>
                {agent.recentAccuracyNote ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-ink-400">Note</p>
                    <p className="text-sm text-ink-700">{agent.recentAccuracyNote}</p>
                  </div>
                ) : null}
                {runs.length ? (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs font-medium text-ink-400">Recent runs</p>
                    <ul className="space-y-1">
                      {runs.map((run) => (
                        <li key={run.id} className="text-xs text-ink-500">
                          {new Date(run.startedAt).toLocaleString()} — {run.outputSummary}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
