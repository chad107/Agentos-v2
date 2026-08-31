import { listVoiceCalls, voiceKpis } from "@/repositories";
import { getAgent } from "@/repositories/agents";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, PriorityChip } from "@/components/ui/Badge";
import { KpiRow } from "@/components/ui/KpiRow";
import { EmptyState } from "@/components/ui/EmptyState";

const outcomeLabels: Record<string, string> = {
  jobber_request_created: "Jobber request created",
  transferred: "Transferred",
  voicemail: "Voicemail",
  no_action: "No action",
  review_needed: "Review needed"
};

export default function VoicePage() {
  const calls = listVoiceCalls();
  const kpis = voiceKpis();
  const voiceAgent = getAgent("voice");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Voice</h1>
        <p className="text-sm text-ink-500">
          Inbound qualification via RingCentral → Jobber request + transcript, with human review.
        </p>
      </div>

      {voiceAgent?.status === "paused" ? (
        <Card className="border-status-attention/30 bg-status-attentionBg/40">
          <CardBody className="pt-4 text-sm text-status-attention">
            Voice Agent is paused pending business hours, transfer-number and booking-authority configuration
            (see 12_OPEN_ITEMS.md). Outbound calling is restricted to contacts with documented consent — AgentOS
            never presents a scraped or purchased contact list as an available automated campaign.
          </CardBody>
        </Card>
      ) : null}

      <KpiRow
        items={[
          { label: "Calls answered", value: kpis.callsAnswered },
          { label: "Qualified requests", value: kpis.qualifiedRequests },
          { label: "Transfers", value: kpis.transfers },
          { label: "Urgent escalations", value: kpis.urgentEscalations },
          { label: "Jobber requests created", value: kpis.jobberRequestsCreated },
          { label: "Needing review", value: kpis.callsNeedingReview }
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Recent calls</h2>
        {calls.length ? (
          <div className="space-y-2">
            {calls.map((call) => (
              <Card key={call.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-2 pt-4">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{call.contactName}</p>
                    <p className="text-xs text-ink-500">{new Date(call.startedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PriorityChip priority={call.urgency} />
                    <Badge className="bg-surface-muted text-ink-700">{outcomeLabels[call.outcome] ?? call.outcome}</Badge>
                    {!call.consentRef && call.direction === "outbound" ? (
                      <Badge className="bg-status-urgentBg text-status-urgent">No consent on file</Badge>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No calls logged yet." />
        )}
      </section>
    </div>
  );
}
