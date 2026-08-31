import Link from "next/link";
import { DIVISIONS } from "@/config/divisions";
import { allDivisionSnapshots } from "@/repositories";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DivisionsPage() {
  const snapshots = allDivisionSnapshots();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Divisions</h1>
        <p className="text-sm text-ink-500">
          One Universal Division Workspace, configuration-driven per division (01_MASTER_SPEC.md).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DIVISIONS.map((division) => {
          const snapshot = snapshots.find((s) => s.config.key === division.key);
          const workQueueCount = snapshot?.workQueueCount ?? 0;
          return (
            <Link key={division.key} href={`/divisions/${division.key}`} className="block">
              <Card className="h-full transition-colors hover:border-brand-300">
                <CardHeader>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{division.label}</p>
                    <p className="text-xs text-ink-500">{division.roster.manager}</p>
                  </div>
                  <Badge
                    className={
                      division.dataStatus === "live"
                        ? "bg-status-safeBg text-status-safe"
                        : "bg-surface-muted text-ink-500"
                    }
                  >
                    {division.dataStatus === "live" ? "Live" : "Mocked"}
                  </Badge>
                </CardHeader>
                <CardBody className="space-y-2">
                  <p className="text-xs text-ink-500">{division.missionSummary}</p>
                  {workQueueCount > 0 ? (
                    <p className="text-xs font-medium text-status-attention">{workQueueCount} in work queue</p>
                  ) : (
                    <p className="text-xs text-ink-400">Nothing needs attention right now.</p>
                  )}
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
