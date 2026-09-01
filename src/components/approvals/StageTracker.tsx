// Deliberate, documented exception to the Core/Dashboard import-boundary
// rule (.eslintrc.json `overrides`, PRODUCTION_READINESS_CHECKLIST.md
// Lane 1): this component is reachable from "use client" entry points
// (ProposalCard, EvidenceDrawer), so it cannot import `@/core` — that
// barrel transitively pulls in server-only modules (the store's
// node:sqlite persistence) that break the client webpack build if bundled
// client-side. `proposalStages` is a pure derivation over the
// already-fetched proposal prop, with no store access, so importing it
// directly is low-risk; see IP_BOUNDARY.md.
import { proposalStages, type StageState } from "@/approvals/stages";
import type { ActionProposal } from "@/domain";

const DOT_STYLES: Record<StageState, string> = {
  done: "bg-status-safe",
  current: "bg-status-info animate-pulse",
  pending: "bg-surface-muted border border-surface-border",
  failed: "bg-status-urgent",
  skipped: "bg-surface-muted border border-surface-border",
  not_applicable: "bg-surface-muted"
};

const LABEL_STYLES: Record<StageState, string> = {
  done: "text-ink-900",
  current: "text-status-info",
  pending: "text-ink-400",
  failed: "text-status-urgent",
  skipped: "text-ink-400",
  not_applicable: "text-ink-400"
};

/**
 * Recommendation -> Approval -> Execution -> Verification, rendered as
 * four explicit steps so an approval is never visually conflated with a
 * verified, successful execution (the core V2 addition).
 */
export function StageTracker({ proposal }: { proposal: ActionProposal }) {
  const stages = proposalStages(proposal);
  return (
    <div>
      <ol className="flex items-center">
        {stages.map((stage, i) => (
          <li key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${DOT_STYLES[stage.state]}`} />
              <span className={`whitespace-nowrap text-[11px] font-medium ${LABEL_STYLES[stage.state]}`}>{stage.label}</span>
            </div>
            {i < stages.length - 1 ? (
              <div className={`mx-1.5 h-px flex-1 ${stage.state === "done" ? "bg-status-safe/50" : "bg-surface-border"}`} aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink-500">{stages[stages.length - 1]?.detail}</p>
    </div>
  );
}
