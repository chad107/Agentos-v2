import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CompetitorSignal } from "@/repositories/sales";

/** Source and uncertainty are always shown (03_DASHBOARD_UX_SPEC.md "Competitor signal panel"). */
export function CompetitorSignals({ signals }: { signals: CompetitorSignal[] }) {
  return (
    <div className="space-y-3">
      {signals.map((s) => (
        <Card key={s.id}>
          <CardBody className="space-y-1.5 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-500">{s.source}</p>
              <Badge className="bg-surface-muted text-ink-500">
                {s.confidence} confidence
              </Badge>
            </div>
            <p className="text-sm text-ink-900">{s.summary}</p>
            <p className="text-xs text-ink-500">
              <span className="font-medium text-ink-700">Suggested response: </span>
              {s.suggestedResponse}
            </p>
            <p className="text-xs text-ink-400">{new Date(s.date).toLocaleDateString()}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
