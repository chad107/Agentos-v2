import { notFound } from "next/navigation";
import Link from "next/link";
import { getDivisionConfig, DIVISIONS } from "@/config/divisions";
import { divisionSnapshot, recommendationsForDivision, marketingIntelligencePreview } from "@/repositories/divisions";
import { Card, CardBody } from "@/components/ui/Card";
import { KpiRow } from "@/components/ui/KpiRow";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { CompetitorSignals } from "@/components/sales/CompetitorSignals";

export function generateStaticParams() {
  return DIVISIONS.map((d) => ({ key: d.key }));
}

export default function DivisionWorkspacePage({ params }: { params: { key: string } }) {
  const config = getDivisionConfig(params.key);
  if (!config) notFound();
  const snapshot = divisionSnapshot(config.key);
  if (!snapshot) notFound();
  const recommendations = recommendationsForDivision(config.key);
  const isMarketing = config.key === "marketing";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-900">{config.label}</h1>
            <Badge
              className={
                config.dataStatus === "live" ? "bg-status-safeBg text-status-safe" : "bg-surface-muted text-ink-500"
              }
            >
              {config.dataStatus === "live" ? "Live" : "Mocked"}
            </Badge>
          </div>
          <p className="text-sm text-ink-500">{config.missionSummary}</p>
        </div>
        {config.legacyRoute ? (
          <Link href={config.legacyRoute} className="text-sm font-medium text-brand-700 hover:underline">
            Open full {config.label} view →
          </Link>
        ) : null}
      </div>

      {snapshot.note ? (
        <EmptyState title={snapshot.note} hint="A future milestone wires this division to real data sources." />
      ) : null}

      {/* 1. Executive summary + roster */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Division manager & specialists</h2>
        <Card>
          <CardBody className="space-y-2">
            <p className="text-sm font-medium text-ink-900">{config.roster.manager}</p>
            <div className="flex flex-wrap gap-1.5">
              {config.roster.specialists.map((s) => (
                <Badge key={s} className="bg-surface-muted text-ink-700">
                  {s}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* 2. KPI cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">KPIs</h2>
        <KpiRow items={snapshot.kpis.map((k) => ({ label: k.label, value: k.value ?? "—" }))} />
      </section>

      {/* 3. Alerts & exceptions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Alerts & exceptions</h2>
        {snapshot.alerts.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.alerts.map((alert) => (
              <Link key={alert.label} href={alert.href}>
                <Card className="transition-colors hover:border-brand-300">
                  <CardBody className="flex items-center justify-between">
                    <span className="text-sm text-ink-700">{alert.label}</span>
                    <span className="text-lg font-bold text-ink-900">{alert.count}</span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing needs attention right now." />
        )}
      </section>

      {/* 4. Active work queue */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Active work queue</h2>
        <Card>
          <CardBody>
            <p className="text-sm text-ink-700">{snapshot.workQueueCount} open item(s) for this division.</p>
            <p className="text-xs text-ink-400">
              A unified cross-division Work Queue (01_MASTER_SPEC.md Milestone 6) is not yet built; this count is
              summed from the division&apos;s own alerts above.
            </p>
          </CardBody>
        </Card>
      </section>

      {/* 5. Forecasting / trends */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Forecasting & trends</h2>
        <EmptyState
          title="Forecasting is not yet implemented."
          hint="No historical KPI observation store exists yet to trend against — tracked as a gap, not shown as invented data."
        />
      </section>

      {/* 6. AI recommendations */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">AI recommendations</h2>
        {recommendations.length ? (
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((r) => (
              <RecommendationCard key={r.id} recommendation={r} />
            ))}
          </div>
        ) : isMarketing ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">
              Preview only — sourced from the Sales division&apos;s competitor intelligence. The Marketing division
              module itself is not yet implemented.
            </p>
            <CompetitorSignals signals={marketingIntelligencePreview()} />
          </div>
        ) : (
          <EmptyState title="No open recommendations for this division." />
        )}
      </section>

      {/* 7. Audit & learning */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Audit & learning</h2>
        <Card>
          <CardBody>
            <p className="text-sm text-ink-700">
              Every material action for this division is recorded in the audit trail.
            </p>
            <Link href="/activity" className="text-sm font-medium text-brand-700 hover:underline">
              View activity log →
            </Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
