import type { Lead, LeadStage } from "@/domain";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "assessment", label: "Assessment" },
  { key: "quote_in_progress", label: "Quote in progress" },
  { key: "quote_sent", label: "Quote sent" },
  { key: "follow_up", label: "Follow-up" },
  { key: "accepted", label: "Accepted" },
  { key: "deposit_pending", label: "Deposit pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "lost_closed", label: "Lost / closed" }
];

export function PipelineBoard({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const count = leads.filter((l) => l.stage === stage.key).length;
        return (
          <div key={stage.key} className="min-w-[110px] flex-1 rounded-card border border-surface-border bg-surface px-3 py-2.5 text-center shadow-card">
            <p className="text-lg font-bold text-ink-900">{count}</p>
            <p className="text-xs text-ink-500">{stage.label}</p>
          </div>
        );
      })}
    </div>
  );
}
