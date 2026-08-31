"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { CategoryChip, ConfidenceBadge, PriorityChip } from "@/components/ui/Badge";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";
import { StageTracker } from "@/components/approvals/StageTracker";
import type { ActionProposal, Finding, Recommendation } from "@/domain";

/**
 * Evidence drawer. Always distinguishes Source fact / Agent inference /
 * Cohen recommendation / Human decision (11_UI_COPY_AND_STATES.md).
 */
export function EvidenceDrawer({
  recommendation,
  open,
  onClose
}: {
  recommendation: Recommendation;
  open: boolean;
  onClose: () => void;
}) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/recommendations/${recommendation.id}`)
      .then((r) => r.json())
      .then((data) => {
        setFindings(data.findings ?? []);
        setProposals(data.proposals ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, recommendation.id]);

  return (
    <Drawer open={open} onClose={onClose} title={`#${recommendation.cohenRank ?? "—"} ${recommendation.title}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityChip priority={recommendation.priority} />
          <CategoryChip category={recommendation.category} />
          <ConfidenceBadge confidence={recommendation.confidence} />
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Cohen recommendation</h3>
          <p className="mt-1 text-sm text-ink-900">{recommendation.summary}</p>
          <p className="mt-2 text-sm text-ink-700">
            <span className="font-medium">Why this matters: </span>
            {recommendation.whyItMatters}
          </p>
          <p className="mt-2 text-sm text-ink-700">
            <span className="font-medium">Decision required: </span>
            {recommendation.decisionRequired}
          </p>
          <p className="mt-1 text-xs text-ink-500">{recommendation.confidenceReason}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Source facts</h3>
          {recommendation.sourceRefs.length ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {recommendation.sourceRefs.map((ref) => (
                <li key={ref} className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs text-ink-500">
                  {ref}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-400">No linked source records.</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Agent inference</h3>
          {loading ? (
            <p className="mt-1 text-sm text-ink-400">Loading…</p>
          ) : findings.length ? (
            <ul className="mt-1.5 space-y-2">
              {findings.map((f) => (
                <li key={f.id} className="rounded-lg border border-surface-border p-2.5 text-sm">
                  <p className="font-medium text-ink-900">{f.title}</p>
                  <p className="mt-0.5 text-ink-500">{f.summary}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {f.agentId} agent · detected {new Date(f.detectedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-400">No linked findings.</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Human decision</h3>
          {loading ? (
            <p className="mt-1 text-sm text-ink-400">Loading…</p>
          ) : proposals.length ? (
            <ul className="mt-1.5 space-y-3">
              {proposals.map((p) => (
                <li key={p.id} className="rounded-lg border border-surface-border p-3">
                  <p className="text-sm font-medium text-ink-900">{p.description}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {p.status === "pending" || p.status === "clarification_requested"
                      ? "Awaiting your decision."
                      : `Status: ${p.status.replace("_", " ")}.`}
                  </p>
                  <div className="mt-2.5">
                    <StageTracker proposal={p} />
                  </div>
                  <div className="mt-2">
                    <ApprovalActions proposal={p} onDecided={(updated) => setProposals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-400">No proposal is linked to this recommendation yet.</p>
          )}
        </section>
      </div>
    </Drawer>
  );
}
