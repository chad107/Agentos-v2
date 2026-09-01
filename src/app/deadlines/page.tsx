import { upcomingDeadlines } from "@/core";
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines";

/**
 * Dedicated drill-down for deadlines (V2 spec, "Full Activity and Upcoming
 * Deadlines should no longer consume large sections of Home").
 */
export default function DeadlinesPage() {
  const items = upcomingDeadlines();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Upcoming deadlines</h1>
        <p className="text-sm text-ink-500">Everything due in the next 7 business days, across every area.</p>
      </div>
      <UpcomingDeadlines items={items} />
    </div>
  );
}
