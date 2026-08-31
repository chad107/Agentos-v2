import { listSafetyRequirements, ladderInspections } from "@/repositories";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KpiRow } from "@/components/ui/KpiRow";
import { EmptyState } from "@/components/ui/EmptyState";

const statusCopy: Record<string, { label: string; className: string }> = {
  missing: { label: "Missing", className: "bg-status-urgentBg text-status-urgent" },
  reminded: { label: "Reminded (4:00 PM)", className: "bg-status-attentionBg text-status-attention" },
  escalated: { label: "Escalated to Cohen (4:30 PM)", className: "bg-status-urgentBg text-status-urgent" },
  submitted: { label: "Submitted", className: "bg-status-safeBg text-status-safe" }
};

export default function SafetyPage() {
  const all = listSafetyRequirements();
  const jsa = all.filter((r) => r.type === "daily_jsa");
  const overdue = jsa.filter((r) => r.status === "missing" || r.status === "reminded" || r.status === "escalated");
  const inspections = ladderInspections();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Safety</h1>
        <p className="text-sm text-ink-500">
          One designated employee per job submits daily JSA evidence, Monday–Friday. Safety findings outrank other routine work.
        </p>
      </div>

      <KpiRow
        items={[
          { label: "JSA tracked today", value: jsa.length },
          { label: "Missing / unresolved", value: overdue.length },
          { label: "Ladder inspections due", value: inspections.length }
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Today&apos;s JSA status</h2>
        {jsa.length ? (
          <div className="space-y-2">
            {jsa.map((r) => {
              const copy = statusCopy[r.status] ?? statusCopy.missing!;
              return (
                <Card key={r.id}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-2 pt-4">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{r.assigneeName}</p>
                      <p className="text-xs text-ink-500">Due {new Date(r.dueAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    <Badge className={copy.className}>{copy.label}</Badge>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="All required JSA evidence is accounted for today." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Monthly ladder inspections</h2>
        {inspections.length ? (
          <div className="space-y-2">
            {inspections.map((r) => (
              <Card key={r.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-2 pt-4">
                  <div>
                    <p className="text-sm font-medium text-ink-900">Rolls up to {r.assigneeName}</p>
                    <p className="text-xs text-ink-500">Due {new Date(r.dueAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={statusCopy[r.status]?.className}>{statusCopy[r.status]?.label ?? r.status}</Badge>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No ladder inspection is currently due." />
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Audit history</h2>
        </CardHeader>
        <CardBody className="pt-0">
          <a href="/activity" className="text-sm font-medium text-brand-700 hover:underline">
            View full activity log →
          </a>
        </CardBody>
      </Card>
    </div>
  );
}
