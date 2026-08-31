"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { CategoryChip, ConfidenceBadge, PriorityChip } from "@/components/ui/Badge";
import { ApprovalActions } from "./ApprovalActions";
import { StageTracker } from "./StageTracker";
import type { ActionProposal } from "@/domain";

/**
 * Approval card. Source: 03_DASHBOARD_UX_SPEC.md "Approval card" — proposed
 * action, requesting agent + Cohen summary, target entity, impact/risk,
 * confidence, evidence, human-readable payload, owner/deadline, actions.
 */
export function ProposalCard({ proposal }: { proposal: ActionProposal }) {
  const [current, setCurrent] = useState(proposal);
  const [showPayload, setShowPayload] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <PriorityChip priority={current.urgency} />
            <CategoryChip category={current.category} />
            <ConfidenceBadge confidence={current.confidence} />
          </div>
          <p className="text-sm font-semibold text-ink-900">{current.description}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Requested by <span className="font-medium text-ink-700">{current.initiatorAgentId}</span> · Target:{" "}
            <span className="font-mono">{current.targetRef}</span>
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-2 text-sm text-ink-700">
        <StageTracker proposal={current} />
        {current.riskIfDelayed ? (
          <p>
            <span className="font-medium text-ink-900">Risk if delayed: </span>
            {current.riskIfDelayed}
          </p>
        ) : null}
        {current.expiresAt ? (
          <p className="text-xs text-ink-500">Expires {new Date(current.expiresAt).toLocaleString()}</p>
        ) : null}
        {current.evidenceRefs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {current.evidenceRefs.map((ref) => (
              <span key={ref} className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs text-ink-500">
                {ref}
              </span>
            ))}
          </div>
        ) : null}
        <button
          onClick={() => setShowPayload((s) => !s)}
          className="text-xs font-medium text-brand-700 hover:underline"
          aria-expanded={showPayload}
        >
          {showPayload ? "Hide proposed content" : "View proposed content"}
        </button>
        {showPayload ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-surface-subtle p-3 text-xs text-ink-700">
            {JSON.stringify(current.payload, null, 2)}
          </pre>
        ) : null}
      </CardBody>
      <CardFooter>
        <ApprovalActions proposal={current} onDecided={setCurrent} />
      </CardFooter>
    </Card>
  );
}
