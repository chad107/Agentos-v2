import Link from "next/link";
import { AGENT_REGISTRY } from "@/config/agent-registry";
import { listAgents } from "@/repositories";
import {
  RISK_TIERS,
  RISK_TIER_LABELS,
  RISK_TIER_DESCRIPTIONS,
  TRUST_STATES,
  TRUST_STATE_LABELS,
  TRUST_STATE_DESCRIPTIONS,
  PROMOTION_CRITERIA,
  DEMOTION_TRIGGERS
} from "@/domain/governance";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/**
 * Governance / progressive trust (01_MASTER_SPEC.md "Governance, approvals,
 * progressive trust"). This page is a policy *view* — it does not change
 * runtime behavior. The approval-first default in src/approvals/engine.ts
 * is unconditional: no trust state recorded here lets any agent bypass
 * approval on a consequential action (CLAUDE.md non-negotiable #6).
 */
export default function GovernancePage() {
  const agents = listAgents();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Governance & progressive trust</h1>
        <p className="text-sm text-ink-500">
          Target state: auto-execute inside explicit guardrails, expanded only after demonstrated reliability. Today,
          every agent in this build stops at draft/propose — the{" "}
          <Link href="/approvals" className="font-medium text-brand-700 hover:underline">
            Approval Centre
          </Link>{" "}
          decides everything consequential, regardless of the trust state below.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Risk tiers</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {RISK_TIERS.map((tier) => (
            <Card key={tier}>
              <CardBody className="space-y-1 pt-4">
                <p className="text-sm font-semibold text-ink-900">{RISK_TIER_LABELS[tier]}</p>
                <p className="text-xs text-ink-500">{RISK_TIER_DESCRIPTIONS[tier]}</p>
                {tier === 4 ? (
                  <Badge className="bg-status-urgentBg text-status-urgent">Blocked by default — no code path exists</Badge>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Trust states</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRUST_STATES.map((state) => (
            <Card key={state}>
              <CardBody className="space-y-1 pt-4">
                <p className="text-sm font-semibold text-ink-900">{TRUST_STATE_LABELS[state]}</p>
                <p className="text-xs text-ink-500">{TRUST_STATE_DESCRIPTIONS[state]}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Current agent classification</h2>
        <div className="overflow-x-auto rounded-card border border-surface-border bg-surface shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-surface-border text-xs font-medium uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2.5">Agent</th>
                <th className="px-4 py-2.5">Risk tier</th>
                <th className="px-4 py-2.5">Trust state</th>
                <th className="px-4 py-2.5">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_REGISTRY.map((entry) => {
                const agent = agents.find((a) => a.id === entry.agentId);
                return (
                  <tr key={entry.agentId} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/agents/${entry.agentId}`} className="font-medium text-brand-700 hover:underline">
                        {agent?.name ?? entry.agentId}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="bg-status-attentionBg text-status-attention">{RISK_TIER_LABELS[entry.riskTier]}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="bg-status-infoBg text-status-info">{TRUST_STATE_LABELS[entry.trustState]}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-500">{entry.trustRationale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-ink-900">Promotion criteria</p>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="list-disc space-y-1 pl-4 text-xs text-ink-500">
              {PROMOTION_CRITERIA.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-400">
              No agent in this build has a real execution-history sample yet — none is shown as promoted.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-ink-900">Demotion triggers</p>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="list-disc space-y-1 pl-4 text-xs text-ink-500">
              {DEMOTION_TRIGGERS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
