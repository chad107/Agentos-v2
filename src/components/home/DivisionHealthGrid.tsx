import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DivisionSnapshot } from "@/repositories/divisions";

/**
 * Cohen Executive Dashboard "division health cards using 3-5 KPI
 * indicators" (01_MASTER_SPEC.md "Cohen Executive Dashboard above the
 * fold"). Compact by design — the full Universal Division Workspace at
 * /divisions/[key] has the rest.
 */
export function DivisionHealthGrid({ snapshots }: { snapshots: DivisionSnapshot[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {snapshots.map((snapshot) => {
        const { config } = snapshot;
        const availableKpis = snapshot.kpis.filter((k) => k.value !== null).slice(0, 3);
        return (
          <Link key={config.key} href={`/divisions/${config.key}`}>
            <Card className="h-full transition-colors hover:border-brand-300">
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold text-ink-900">{config.label}</p>
                {snapshot.workQueueCount > 0 ? (
                  <Badge className="bg-status-attentionBg text-status-attention">{snapshot.workQueueCount}</Badge>
                ) : (
                  <Badge className="bg-status-safeBg text-status-safe">0</Badge>
                )}
              </CardHeader>
              <CardBody className="space-y-1 pt-0">
                {availableKpis.length ? (
                  availableKpis.map((kpi) => (
                    <p key={kpi.label} className="text-xs text-ink-500">
                      <span className="font-medium text-ink-700">{kpi.value}</span> {kpi.label.toLowerCase()}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-ink-400">{config.dataStatus === "mocked" ? "Not yet implemented." : "No signal yet."}</p>
                )}
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
