import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { isSlaBreached } from "@/core";
import type { Lead } from "@/domain";

const scoreStyles: Record<Lead["score"], string> = {
  hot: "bg-status-urgentBg text-status-urgent",
  normal: "bg-status-infoBg text-status-info",
  stale: "bg-surface-muted text-ink-500",
  at_risk: "bg-status-attentionBg text-status-attention"
};

const stageLabels: Record<Lead["stage"], string> = {
  new: "New",
  contacted: "Contacted",
  assessment: "Assessment",
  quote_in_progress: "Quote in progress",
  quote_sent: "Quote sent",
  follow_up: "Follow-up",
  accepted: "Accepted",
  deposit_pending: "Deposit pending",
  scheduled: "Scheduled",
  lost_closed: "Lost / closed"
};

export function LeadCard({ lead }: { lead: Lead }) {
  const breached = isSlaBreached(lead);
  return (
    <Card id={lead.id} className="scroll-mt-20">
      <CardBody className="space-y-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{lead.customerName}</p>
            <p className="text-xs text-ink-500">{lead.serviceType}</p>
          </div>
          <Badge className={scoreStyles[lead.score]}>{lead.score.replace("_", " ")}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Badge className="bg-surface-muted text-ink-700">{stageLabels[lead.stage]}</Badge>
          <span className="text-ink-400">via {lead.source.replace("_", " ")}</span>
        </div>

        {breached ? (
          <p className="text-xs font-medium text-status-urgent">Response SLA breached</p>
        ) : (
          <p className="text-xs text-ink-400">Owner: {lead.ownerName}</p>
        )}

        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">Latest: </span>
          {lead.latestTouch}
        </p>
        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">Next: </span>
          {lead.nextAction}
        </p>
        {lead.quoteValue ? (
          <p className="text-xs text-ink-500">
            <span className="font-medium text-ink-700">Quote: </span>${lead.quoteValue.toLocaleString()}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
