import { top3Recommendations } from "./recommendations";
import { listProposals } from "./approvals";
import { leadsOutsideSla } from "./sales";
import { jobsAtRisk, todaysAndNextDayJobs } from "./operations";
import { safetyEvidenceMissingCount } from "./safety";
import { billsDueSoon } from "./accounting";
import { listAgents } from "./agents";
import { listActivity } from "./activity";
import { getStore } from "@/data/store";
import { cohenHeaderMessage } from "@/cohen/orchestrate";
import { businessDaysFromNow } from "@/lib/dates";
import { trackedCounts } from "./tracked";
import { getTenantConfig } from "@/config/tenant";

export interface AttentionCounters {
  urgentExceptions: number;
  pendingApprovals: number;
  jobsAtRisk: number;
  leadsOutsideSla: number;
  safetyEvidenceMissing: number;
  billsDueSoon: number;
}

export function attentionCounters(): AttentionCounters {
  const pending = listProposals({ status: "pending" });
  const urgentPending = pending.filter((p) => p.urgency === "urgent").length;
  return {
    urgentExceptions: urgentPending,
    pendingApprovals: pending.length + listProposals({ status: "clarification_requested" }).length,
    jobsAtRisk: jobsAtRisk().length,
    leadsOutsideSla: leadsOutsideSla().length,
    safetyEvidenceMissing: safetyEvidenceMissingCount(),
    billsDueSoon: billsDueSoon().length
  };
}

export interface NeedsAttentionRow {
  key: keyof AttentionCounters;
  icon: "🔴" | "🟠" | "🟡";
  area: string;
  label: string;
  count: number;
  href: string;
}

/**
 * Replaces the six equal-weight counter tiles with a severity-ordered list
 * that only shows areas that actually need something (V2 spec, "Needs
 * Attention" — don't give healthy/zero conditions equal visual weight).
 */
export function needsAttention(): { rows: NeedsAttentionRow[]; total: number } {
  const counters = attentionCounters();
  const candidates: NeedsAttentionRow[] = [
    {
      key: "safetyEvidenceMissing",
      icon: "🔴",
      area: "Safety",
      label: `${counters.safetyEvidenceMissing} missing evidence`,
      count: counters.safetyEvidenceMissing,
      href: "/safety"
    },
    {
      key: "pendingApprovals",
      icon: "🟠",
      area: "Approvals",
      label: `${counters.pendingApprovals} waiting`,
      count: counters.pendingApprovals,
      href: "/approvals"
    },
    {
      key: "jobsAtRisk",
      icon: "🟠",
      area: "Operations",
      label: `${counters.jobsAtRisk} job${counters.jobsAtRisk === 1 ? "" : "s"} at risk`,
      count: counters.jobsAtRisk,
      href: "/operations"
    },
    {
      key: "leadsOutsideSla",
      icon: "🟡",
      area: "Sales",
      label: `${counters.leadsOutsideSla} lead${counters.leadsOutsideSla === 1 ? "" : "s"} outside SLA`,
      count: counters.leadsOutsideSla,
      href: "/sales"
    },
    {
      key: "billsDueSoon",
      icon: "🟡",
      area: "Accounting",
      label: `${counters.billsDueSoon} bill${counters.billsDueSoon === 1 ? "" : "s"} due soon`,
      count: counters.billsDueSoon,
      href: "/accounting"
    }
  ];
  const rows = candidates.filter((r) => r.count > 0);
  return { rows, total: rows.reduce((sum, r) => sum + r.count, 0) };
}

export interface HealthIndicator {
  area: string;
  status: "good" | "attention" | "urgent";
  label: string;
  href: string;
}

export function businessHealth(): HealthIndicator[] {
  const counters = attentionCounters();
  return [
    {
      area: "Sales",
      status: counters.leadsOutsideSla > 0 ? "attention" : "good",
      label: counters.leadsOutsideSla > 0 ? `${counters.leadsOutsideSla} lead(s) outside SLA` : "All leads within SLA",
      href: "/sales"
    },
    {
      area: "Operations",
      status: counters.jobsAtRisk > 0 ? "attention" : "good",
      label: counters.jobsAtRisk > 0 ? `${counters.jobsAtRisk} job(s) at risk` : "All jobs on track",
      href: "/operations"
    },
    {
      area: "Safety",
      status: counters.safetyEvidenceMissing > 0 ? "urgent" : "good",
      label:
        counters.safetyEvidenceMissing > 0
          ? `${counters.safetyEvidenceMissing} safety item(s) need evidence`
          : "All current JSA evidence accounted for",
      href: "/safety"
    },
    {
      area: "Accounting",
      status: counters.billsDueSoon > 0 ? "attention" : "good",
      label: counters.billsDueSoon > 0 ? `${counters.billsDueSoon} bill(s) due soon` : "No bills due soon",
      href: "/accounting"
    },
    {
      area: "Customers",
      status: "good",
      label: "No urgent unresolved cases",
      href: "/customers"
    }
  ];
}

export function upcomingDeadlines() {
  const store = getStore();
  const window = businessDaysFromNow(7);
  const items: { id: string; label: string; dueAt: string; category: string; href: string }[] = [];

  for (const lead of store.leads) {
    if (lead.stage === "follow_up" && new Date(lead.slaDueAt).getTime() <= window.getTime()) {
      items.push({ id: lead.id, label: `Follow up: ${lead.customerName}`, dueAt: lead.slaDueAt, category: "Sales", href: "/sales" });
    }
  }
  for (const bill of store.accountingItems) {
    if (bill.dueAt && new Date(bill.dueAt).getTime() <= window.getTime()) {
      items.push({ id: bill.id, label: `Bill due: ${bill.vendorOrCustomerName}`, dueAt: bill.dueAt, category: "Accounting", href: "/accounting" });
    }
  }
  for (const job of store.jobs) {
    if (new Date(job.scheduledStart).getTime() <= window.getTime() && job.readinessStatus !== "complete") {
      items.push({ id: job.id, label: `Install readiness: ${job.customerName}`, dueAt: job.scheduledStart, category: "Operations", href: `/operations/${job.id}` });
    }
  }
  for (const safety of store.safetyRequirements) {
    if (new Date(safety.dueAt).getTime() <= window.getTime() && safety.status !== "submitted") {
      items.push({ id: safety.id, label: `Safety evidence: ${safety.assigneeName}`, dueAt: safety.dueAt, category: "Safety", href: "/safety" });
    }
  }

  return items.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 8);
}

export function homeSnapshot() {
  const top3 = top3Recommendations();
  const counters = attentionCounters();
  const tenant = getTenantConfig();
  return {
    business: { id: tenant.businessId, name: tenant.businessName, timezone: tenant.timezone },
    cohenMessage: cohenHeaderMessage({ urgent: counters.urgentExceptions, decisions: top3.length }),
    top3,
    attention: counters,
    health: businessHealth(),
    todaysOperations: todaysAndNextDayJobs(),
    agents: listAgents(),
    activity: listActivity({ limit: 12 }),
    upcomingDeadlines: upcomingDeadlines(),
    trackedCounts: trackedCounts(),
    needsAttention: needsAttention()
  };
}
