import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import type { Job, JobReadinessStatus } from "@/domain";

const READINESS_TONE: Record<JobReadinessStatus, { icon: "🟢" | "🟡" | "🔴"; label: string }> = {
  ready: { icon: "🟢", label: "Ready" },
  in_progress: { icon: "🟢", label: "Ready" },
  complete: { icon: "🟢", label: "Ready" },
  needs_review: { icon: "🟡", label: "Attention" },
  at_risk: { icon: "🟡", label: "Attention" },
  closeout_missing: { icon: "🟡", label: "Attention" },
  unknown: { icon: "🟡", label: "Attention" },
  blocked: { icon: "🔴", label: "Blocked" }
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/**
 * Strengthened Today's Operations (V2 spec, "Strengthen Today"): compact
 * rows of Customer | Job type | Time | Crew | Readiness. A quiet day gets
 * a single line, not a large empty-state box, and still surfaces a preview
 * of tomorrow so the crew isn't surprised.
 */
export function TodaysOperations({ jobs }: { jobs: Job[] }) {
  const today = jobs.filter((j) => isToday(j.scheduledStart));
  const tomorrow = jobs.filter((j) => !isToday(j.scheduledStart));
  const tomorrowNeedsAttention = tomorrow.filter((j) => READINESS_TONE[j.readinessStatus].icon !== "🟢").length;

  if (!today.length) {
    return (
      <div className="rounded-card border border-surface-border bg-surface px-4 py-3 text-sm shadow-card">
        <p className="text-ink-700">No jobs scheduled today.</p>
        {tomorrow.length ? (
          <p className="mt-0.5 text-ink-500">
            Tomorrow: {tomorrow.length} job{tomorrow.length === 1 ? "" : "s"}
            {tomorrowNeedsAttention ? ` · ${tomorrowNeedsAttention} needs attention` : ""}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {today.map((job) => {
        const tone = READINESS_TONE[job.readinessStatus];
        return (
          <Link key={job.id} href={`/operations/${job.id}`} className="block">
            <Card className="transition-colors hover:border-brand-200">
              <CardBody className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{job.customerName}</p>
                  <p className="text-xs text-ink-500">{job.serviceType}</p>
                </div>
                <p className="text-ink-700">
                  {new Date(job.scheduledStart).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-ink-500">Crew: {job.crewRefs.join(", ")}</p>
                <p className="flex items-center gap-1 font-medium text-ink-900">
                  <span aria-hidden>{tone.icon}</span>
                  {tone.label}
                </p>
              </CardBody>
            </Card>
          </Link>
        );
      })}
      {tomorrow.length ? (
        <p className="px-1 text-xs text-ink-500">
          Tomorrow: {tomorrow.length} job{tomorrow.length === 1 ? "" : "s"}
          {tomorrowNeedsAttention ? ` · ${tomorrowNeedsAttention} needs attention` : ""}
        </p>
      ) : null}
    </div>
  );
}
