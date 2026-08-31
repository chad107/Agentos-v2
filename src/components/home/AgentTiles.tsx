import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/Badge";
import type { Agent } from "@/domain";
import { AGENT_STATUS_COPY } from "@/domain";

const toneFor: Record<Agent["status"], "good" | "attention" | "urgent" | "info"> = {
  idle: "info",
  monitoring: "good",
  running: "info",
  blocked: "urgent",
  needs_human: "attention",
  degraded: "attention",
  paused: "info"
};

export function AgentTiles({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {agents.map((agent) => (
        <Link key={agent.id} href="/agents">
          <Card className="h-full transition-colors hover:border-brand-200">
            <CardBody className="space-y-1.5 pt-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{agent.name}</p>
                <StatusPill tone={toneFor[agent.status]}>{AGENT_STATUS_COPY[agent.status]}</StatusPill>
              </div>
              <p className="text-xs text-ink-500">{agent.currentTask ?? "No active task"}</p>
              <p className="text-xs text-ink-400">
                {agent.openFindingsCount} open finding{agent.openFindingsCount === 1 ? "" : "s"} · last run{" "}
                {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "never"}
              </p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}
