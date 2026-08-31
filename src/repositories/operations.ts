// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { EquipmentItem, Job, JobRequirement } from "@/domain";
import { getStore } from "@/data/store";
import { businessDaysFromNow } from "@/lib/dates";

export function listJobs(): Job[] {
  return getStore().jobs;
}

export function getJob(id: string): Job | undefined {
  return getStore().jobs.find((j) => j.id === id);
}

export function requirementsForJob(jobId: string): JobRequirement[] {
  return getStore().jobRequirements.filter((r) => r.jobId === jobId);
}

export function equipmentForJob(jobId: string): EquipmentItem[] {
  return getStore().equipmentItems.filter((e) => e.jobId === jobId);
}

export function jobsAtRisk(): Job[] {
  return listJobs().filter((j) => j.readinessStatus === "at_risk" || j.readinessStatus === "blocked");
}

export function jobsWithMissingCloseout(): Job[] {
  return listJobs().filter((j) => j.readinessStatus === "closeout_missing");
}

/** True when a job is scheduled within the 3-business-day readiness window (04_AGENT_ROLES_AND_WORKFLOWS.md). */
export function isWithinReadinessWindow(job: Job, reference: Date = new Date()): boolean {
  const deadline = businessDaysFromNow(3, reference);
  return new Date(job.scheduledStart).getTime() <= deadline.getTime();
}

export function todaysAndNextDayJobs(): Job[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2); // today + next business day window (simplified for demo)
  return listJobs().filter((j) => {
    const t = new Date(j.scheduledStart).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}
