import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAgent,
  runsForAgent,
  AGENT_IDS,
  getAgentRegistryEntry,
  getDivisionConfig,
  RISK_TIER_DESCRIPTIONS,
  RISK_TIER_LABELS,
  TRUST_STATE_DESCRIPTIONS,
  TRUST_STATE_LABELS
} from "@/core";
import { AGENT_STATUS_COPY } from "@/domain";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, StatusPill } from "@/components/ui/Badge";
import { AgentRunButton } from "@/components/agents/AgentRunButton";

export function generateStaticParams() {
  return AGENT_IDS.map((id) => ({ id }));
}

const toneFor: Record<string, "good" | "attention" | "urgent" | "info"> = {
  idle: "info",
  monitoring: "good",
  running: "info",
  blocked: "urgent",
  needs_human: "attention",
  degraded: "attention",
  paused: "info"
};

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  if (!AGENT_IDS.includes(params.id as (typeof AGENT_IDS)[number])) notFound();
  const agent = getAgent(params.id as (typeof AGENT_IDS)[number]);
  if (!agent) notFound();
  const registryEntry = getAgentRegistryEntry(agent.id);
  const division = registryEntry ? getDivisionConfig(registryEntry.divisionKey) : undefined;
  const runs = runsForAgent(agent.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/agents" className="text-xs font-medium text-brand-700 hover:underline">
          ← Agent Centre
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink-900">{agent.name}</h1>
          <StatusPill tone={toneFor[agent.status] ?? "info"}>{AGENT_STATUS_COPY[agent.status]}</StatusPill>
          {registryEntry ? <Badge className="bg-surface-muted text-ink-700">v{registryEntry.version}</Badge> : null}
        </div>
        <p className="text-sm text-ink-500">{agent.mission}</p>
        {division ? (
          <Link href={`/divisions/${division.key}`} className="text-xs font-medium text-brand-700 hover:underline">
            {division.label} division →
          </Link>
        ) : null}
      </div>

      {registryEntry ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold text-ink-900">Risk tier</p>
            </CardHeader>
            <CardBody className="space-y-1 pt-0">
              <Badge className="bg-status-attentionBg text-status-attention">{RISK_TIER_LABELS[registryEntry.riskTier]}</Badge>
              <p className="text-xs text-ink-500">{RISK_TIER_DESCRIPTIONS[registryEntry.riskTier]}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold text-ink-900">Trust state</p>
            </CardHeader>
            <CardBody className="space-y-1 pt-0">
              <Badge className="bg-status-infoBg text-status-info">{TRUST_STATE_LABELS[registryEntry.trustState]}</Badge>
              <p className="text-xs text-ink-500">{TRUST_STATE_DESCRIPTIONS[registryEntry.trustState]}</p>
              <p className="text-xs text-ink-400">{registryEntry.trustRationale}</p>
            </CardBody>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-ink-900">Contract</p>
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
          {registryEntry ? (
            <>
              <div>
                <p className="text-xs font-medium text-ink-400">Capabilities</p>
                <p className="text-sm text-ink-700">{registryEntry.capabilities.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Required permissions</p>
                <p className="text-sm text-ink-700">{registryEntry.requiredPermissions.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Subscribed events</p>
                <p className="text-sm text-ink-700">{registryEntry.subscribedEvents.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Emitted events</p>
                <p className="text-sm text-ink-700">{registryEntry.emittedEvents.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">KPI mappings</p>
                <p className="text-sm text-ink-700">{registryEntry.kpiMappings.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Knowledge scopes</p>
                <p className="text-sm text-ink-700">{registryEntry.knowledgeScopes.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Escalation target</p>
                <p className="text-sm text-ink-700">{registryEntry.escalationTarget}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400">Accountable human role</p>
                <p className="text-sm text-ink-700">{registryEntry.accountableHumanRole}</p>
              </div>
            </>
          ) : null}
          <div>
            <p className="text-xs font-medium text-ink-400">Schedules</p>
            <p className="text-sm text-ink-700">{agent.schedules.join("; ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Current task</p>
            <p className="text-sm text-ink-700">{agent.currentTask ?? "None"}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-ink-900">Recent executions</p>
          <AgentRunButton agentId={agent.id} />
        </CardHeader>
        <CardBody className="pt-0">
          {runs.length ? (
            <ul className="space-y-2">
              {runs.map((run) => (
                <li key={run.id} className="text-xs text-ink-500">
                  <span className="font-medium text-ink-700">{new Date(run.startedAt).toLocaleString()}</span> —{" "}
                  {run.outputSummary}
                  {run.error ? <span className="text-status-urgent"> — {run.error}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No recorded executions yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
