import { listJobs, jobsAtRisk, jobsWithMissingCloseout } from "@/core";
import { KpiRow } from "@/components/ui/KpiRow";
import { JobBoard } from "@/components/operations/JobBoard";

export default function OperationsPage() {
  const jobs = listJobs();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Operations</h1>
        <p className="text-sm text-ink-500">Make install/service readiness visible before crews arrive.</p>
      </div>

      <KpiRow
        items={[
          { label: "Active jobs", value: jobs.filter((j) => j.stage !== "complete").length },
          { label: "At risk", value: jobsAtRisk().length },
          { label: "Closeout missing", value: jobsWithMissingCloseout().length },
          { label: "Ready", value: jobs.filter((j) => j.stage === "ready").length }
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Job readiness board</h2>
        <JobBoard jobs={jobs} />
      </section>
    </div>
  );
}
