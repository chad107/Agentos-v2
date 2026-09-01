import Link from "next/link";
import { homeSnapshot, allDivisionSnapshots } from "@/core";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { NothingLeftBehind } from "@/components/home/NothingLeftBehind";
import { NeedsAttention } from "@/components/home/NeedsAttention";
import { HealthStrip } from "@/components/home/HealthStrip";
import { TodaysOperations } from "@/components/home/TodaysOperations";
import { AgentTiles } from "@/components/home/AgentTiles";
import { DivisionHealthGrid } from "@/components/home/DivisionHealthGrid";

/**
 * Home hierarchy (V2 spec, "Redesign the Home hierarchy"):
 *   Cohen Morning Brief -> Top 3 -> Nothing Left Behind -> Today ->
 *   Business Health -> Agents
 * Full Activity and Upcoming Deadlines get their own dedicated views
 * (/activity, /deadlines) instead of consuming large sections here.
 */
export default function HomePage() {
  const snapshot = homeSnapshot();
  const divisions = allDivisionSnapshots();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section aria-labelledby="cohen-heading">
        <p className="text-sm text-ink-500">Good {timeOfDayGreeting()}.</p>
        <h1 id="cohen-heading" className="text-2xl font-bold text-ink-900">
          Cohen — AI Operations Manager
        </h1>
        <p className="mt-1 text-sm text-ink-700">{snapshot.cohenMessage}</p>
      </section>

      <section aria-labelledby="top3-heading" className="space-y-3">
        <h2 id="top3-heading" className="text-lg font-semibold text-ink-900">
          Today&apos;s Top 3
        </h2>
        {snapshot.top3.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {snapshot.top3.map((rec, i) => (
              <RecommendationCard key={rec.id} recommendation={rec} emphasize={i === 0} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-500">Nothing urgent is unresolved. Check Approvals for routine items.</p>
        )}
      </section>

      <section aria-labelledby="divisions-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="divisions-heading" className="text-lg font-semibold text-ink-900">
            Divisions
          </h2>
          <Link href="/divisions" className="text-sm font-medium text-brand-700 hover:underline">
            Open all divisions →
          </Link>
        </div>
        <DivisionHealthGrid snapshots={divisions} />
      </section>

      <section aria-labelledby="nlb-heading" className="space-y-3">
        <h2 id="nlb-heading" className="sr-only">
          Nothing Left Behind
        </h2>
        <NothingLeftBehind counts={snapshot.trackedCounts} />
      </section>

      <section aria-labelledby="ops-heading" className="space-y-3">
        <h2 id="ops-heading" className="text-lg font-semibold text-ink-900">
          Today&apos;s operations
        </h2>
        <TodaysOperations jobs={snapshot.todaysOperations} />
      </section>

      <section aria-labelledby="health-heading" className="space-y-3">
        <h2 id="health-heading" className="text-lg font-semibold text-ink-900">
          Business health
        </h2>
        <NeedsAttention rows={snapshot.needsAttention.rows} total={snapshot.needsAttention.total} />
        <HealthStrip health={snapshot.health} />
      </section>

      <section aria-labelledby="agents-heading" className="space-y-3">
        <h2 id="agents-heading" className="text-lg font-semibold text-ink-900">
          Agents
        </h2>
        <AgentTiles agents={snapshot.agents} />
      </section>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-surface-border pt-3 text-sm">
        <Link href="/activity" className="font-medium text-brand-700 hover:underline">
          View full activity →
        </Link>
        <Link href="/deadlines" className="font-medium text-brand-700 hover:underline">
          View upcoming deadlines →
        </Link>
      </div>
    </div>
  );
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
