import { listLeads, salesKpis, competitorSignals } from "@/core";
import { KpiRow } from "@/components/ui/KpiRow";
import { PipelineBoard } from "@/components/sales/PipelineBoard";
import { LeadCard } from "@/components/sales/LeadCard";
import { CompetitorSignals } from "@/components/sales/CompetitorSignals";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SalesPage() {
  const leads = listLeads();
  const kpis = salesKpis();
  const signals = competitorSignals();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Sales</h1>
        <p className="text-sm text-ink-500">Prevent missed leads, slow response and weak follow-up.</p>
      </div>

      <KpiRow
        items={[
          { label: "New leads today", value: kpis.newLeadsToday },
          { label: "Median response (min)", value: kpis.medianResponseMinutes ?? "—" },
          { label: "Outside SLA", value: kpis.leadsOutsideSlaCount },
          { label: "Quotes awaiting customer", value: kpis.quotesAwaitingCustomer },
          { label: "Manual follow-up needed", value: kpis.quotesRequiringManualFollowup },
          { label: "Accepted, awaiting next step", value: kpis.acceptedAwaitingNextStep }
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Pipeline</h2>
        <PipelineBoard leads={leads} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Leads</h2>
        {leads.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <EmptyState title="No leads yet." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Competitor signals</h2>
        <CompetitorSignals signals={signals} />
      </section>
    </div>
  );
}
