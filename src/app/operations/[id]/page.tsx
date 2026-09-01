import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob, requirementsForJob, equipmentForJob, listRecommendations, listSafetyRequirements } from "@/core";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ReadinessBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const requirementStatusStyles: Record<string, string> = {
  missing: "bg-status-urgentBg text-status-urgent",
  pending: "bg-status-attentionBg text-status-attention",
  satisfied: "bg-status-safeBg text-status-safe"
};

const equipmentStatusStyles: Record<string, string> = {
  unconfirmed: "bg-status-urgentBg text-status-urgent",
  pending: "bg-status-attentionBg text-status-attention",
  ordered: "bg-status-infoBg text-status-info",
  shipped: "bg-status-infoBg text-status-info",
  delivered: "bg-status-safeBg text-status-safe",
  confirmed: "bg-status-safeBg text-status-safe"
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) notFound();

  const requirements = requirementsForJob(job.id);
  const equipment = equipmentForJob(job.id);
  const safety = listSafetyRequirements().filter((s) => s.jobId === job.id);
  const linkedRecommendation = listRecommendations().find((r) => r.linkedEntity?.type === "job" && r.linkedEntity.id === job.id);

  const missingRequirements = requirements.filter((r) => r.status === "missing");
  const closeoutRequirements = requirements.filter((r) => r.type === "photo" || r.type === "model_number");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/operations" className="text-sm text-brand-700 hover:underline">
          ← Job readiness board
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{job.customerName}</h1>
            <p className="text-sm text-ink-500">
              {job.community} · Jobber job #{job.jobberId} · estimate {job.jobberEstimateRef}
            </p>
          </div>
          <ReadinessBadge status={job.readinessStatus} />
        </div>
      </div>

      {linkedRecommendation ? (
        <Card className="border-brand-200 bg-brand-50/40">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Cohen&apos;s recommendation</p>
              <p className="text-sm text-ink-900">{linkedRecommendation.title}</p>
            </div>
            <Link href="/approvals" className="text-sm font-medium text-brand-700 hover:underline">
              Review in Approval Centre →
            </Link>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Job overview</h2>
        </CardHeader>
        <CardBody className="grid gap-3 pt-0 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-ink-400">Scheduled start</p>
            <p className="text-sm text-ink-900">{new Date(job.scheduledStart).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Crew</p>
            <p className="text-sm text-ink-900">{job.crewRefs.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Readiness score</p>
            <p className="text-sm text-ink-900">{job.readinessScore}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Stage</p>
            <p className="text-sm text-ink-900">{job.stage.replace(/_/g, " ")}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Open questions / exceptions</h2>
        </CardHeader>
        <CardBody className="pt-0">
          {job.openQuestions.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-status-attention">
              {job.openQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No open exceptions.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Equipment (from Jobber estimate)</h2>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {equipment.length ? (
            equipment.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border p-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-900">
                    {e.manufacturer} {e.model} × {e.quantity}
                  </p>
                  <p className="text-xs text-ink-500">
                    {e.supplier}
                    {e.trackingRef ? ` · Tracking: ${e.trackingRef}` : ""}
                  </p>
                </div>
                <Badge className={equipmentStatusStyles[e.status]}>{e.status}</Badge>
              </div>
            ))
          ) : (
            <EmptyState title="No equipment lines linked yet." />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Requirements</h2>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {requirements.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border p-2.5 text-sm">
              <div>
                <p className="font-medium text-ink-900">{r.description}</p>
                <p className="text-xs text-ink-500">
                  {r.type.replace(/_/g, " ")} · owner {r.ownerRef}
                  {r.requiredBy ? ` · due ${new Date(r.requiredBy).toLocaleString()}` : ""}
                </p>
              </div>
              <Badge className={requirementStatusStyles[r.status]}>{r.status}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Safety (JSA)</h2>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {safety.length ? (
            safety.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border p-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{s.type === "daily_jsa" ? "Daily JSA" : "Ladder inspection"}</p>
                  <p className="text-xs text-ink-500">
                    {s.assigneeName} · due {new Date(s.dueAt).toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={
                    s.status === "submitted" ? "bg-status-safeBg text-status-safe" : "bg-status-attentionBg text-status-attention"
                  }
                >
                  {s.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No safety requirement is linked to this job yet.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Closeout evidence (CompanyCam)</h2>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {closeoutRequirements.length ? (
            closeoutRequirements.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border p-2.5 text-sm">
                <p className="text-ink-900">{r.description}</p>
                <Badge className={requirementStatusStyles[r.status]}>{r.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No closeout evidence requirement is tracked for this job.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Recommended next action</h2>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-ink-700">
            {missingRequirements.length
              ? `Resolve ${missingRequirements.length} missing requirement${missingRequirements.length === 1 ? "" : "s"} before the readiness deadline.`
              : "No missing requirements — job is on track."}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
