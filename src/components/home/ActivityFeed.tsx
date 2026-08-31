import { EmptyState } from "@/components/ui/EmptyState";
import type { AuditEvent } from "@/domain";

const actorLabel: Record<AuditEvent["actorType"], string> = {
  human: "You",
  agent: "Agent",
  cohen: "Cohen",
  system: "System"
};

export function ActivityFeed({ events }: { events: AuditEvent[] }) {
  if (!events.length) {
    return <EmptyState title="No activity yet today." />;
  }
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-ink-900">{event.summary}</p>
            <p className="text-xs text-ink-400">
              {actorLabel[event.actorType]} · {new Date(event.occurredAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
