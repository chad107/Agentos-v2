import Link from "next/link";
import { ReadinessBadge } from "@/components/ui/Badge";
import type { Job, JobReadinessStatus } from "@/domain";

const COLUMNS: { key: Job["stage"]; label: string }[] = [
  { key: "newly_approved", label: "Newly approved" },
  { key: "needs_review", label: "Needs review" },
  { key: "material_check", label: "Material/equipment check" },
  { key: "shipment_pending", label: "Shipment pending" },
  { key: "ready", label: "Ready" },
  { key: "in_progress", label: "In progress" },
  { key: "closeout_missing", label: "Closeout missing" },
  { key: "complete", label: "Complete" }
];

export function JobBoard({ jobs }: { jobs: Job[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.stage === col.key);
        return (
          <div key={col.key} className="w-64 shrink-0">
            <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-400">
              {col.label}
              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-ink-500">{colJobs.length}</span>
            </p>
            <div className="space-y-2">
              {colJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/operations/${job.id}`}
                  className="block rounded-card border border-surface-border bg-surface p-3 shadow-card hover:border-brand-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">{job.customerName}</p>
                    <ReadinessBadge status={job.readinessStatus as JobReadinessStatus} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{job.community}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {new Date(job.scheduledStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · Jobber #{job.jobberId}
                  </p>
                </Link>
              ))}
              {colJobs.length === 0 ? <p className="text-xs text-ink-300">—</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
