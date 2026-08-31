import { getJob, requirementsForJob, equipmentForJob } from "@/repositories";
import { listSafetyRequirements } from "@/repositories/safety";
import { ok, notFound } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return notFound("Job not found.");
  const safety = listSafetyRequirements().filter((s) => s.jobId === job.id);
  return ok({
    job,
    requirements: requirementsForJob(job.id),
    equipment: equipmentForJob(job.id),
    safety
  });
}
