"use client";

import { useEffect, useState } from "react";
import type { AuditActorType, AuditEvent } from "@/domain";

const ACTOR_TYPES: { value: AuditActorType | ""; label: string }[] = [
  { value: "", label: "All actors" },
  { value: "human", label: "Human" },
  { value: "agent", label: "Agent" },
  { value: "cohen", label: "Cohen" },
  { value: "system", label: "System" }
];

/**
 * Activity / Audit timeline. Each item answers: what happened, who/what
 * detected it, which source records were used, what Cohen recommended, who
 * decided, what was executed, and did it succeed (03_DASHBOARD_UX_SPEC.md
 * "10. Activity / Audit").
 */
export default function ActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [actorType, setActorType] = useState<AuditActorType | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actorType) params.set("actorType", actorType);
    params.set("limit", "200");
    fetch(`/api/activity?${params.toString()}`)
      .then((r) => r.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [actorType]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Activity / Audit</h1>
        <p className="text-sm text-ink-500">
          An append-only trail of every finding, recommendation, decision and execution result.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="actor-filter" className="text-sm text-ink-500">
          Filter by actor
        </label>
        <select
          id="actor-filter"
          value={actorType}
          onChange={(e) => setActorType(e.target.value as AuditActorType | "")}
          className="rounded-lg border border-surface-border px-2 py-1.5 text-sm"
        >
          {ACTOR_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : events.length ? (
        <ol className="space-y-3 border-l border-surface-border pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-400" aria-hidden />
              <p className="text-ink-900">{event.summary}</p>
              <p className="text-xs text-ink-400">
                {event.actorType} · {event.eventType} · {event.entityType}
                {event.entityId !== "n/a" ? ` #${event.entityId}` : ""} · {new Date(event.occurredAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-500">No activity matches this filter.</p>
      )}
    </div>
  );
}
