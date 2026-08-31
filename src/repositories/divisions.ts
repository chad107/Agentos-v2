/**
 * Universal Division Workspace read model. Computes each division's KPI
 * cards and alert/exception counts from the real repository data that
 * already exists for that division. Where the spec names a KPI this build
 * has no data source for yet, the value is `null` (rendered as "—" by the
 * UI) rather than a fabricated number — 01_MASTER_SPEC.md "Do not
 * fabricate".
 */

import type { DivisionConfig, DivisionKey } from "@/domain/platform";
import { DIVISIONS, getDivisionConfig } from "@/config/divisions";
import { listLeads, leadsOutsideSla, competitorSignals } from "./sales";
import { listJobs, jobsAtRisk, jobsWithMissingCloseout } from "./operations";
import { listSafetyRequirements, safetyEvidenceMissingCount } from "./safety";
import { listAccountingItems, billsDueSoon, exceptions as accountingExceptions } from "./accounting";
import { listCustomerCases, openCustomerCases } from "./customers";
import { listProposals } from "./approvals";
import { listRecommendations, top3Recommendations } from "./recommendations";
import { minutesBetween } from "@/lib/dates";
import type { Recommendation, RecommendationCategory } from "@/domain";

export interface DivisionKpiValue {
  label: string;
  value: string | null;
}

export interface DivisionAlert {
  label: string;
  count: number;
  href: string;
}

export interface DivisionSnapshot {
  config: DivisionConfig;
  kpis: DivisionKpiValue[];
  alerts: DivisionAlert[];
  workQueueCount: number;
  note: string | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid] ?? null;
}

function currency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function percent(numerator: number, denominator: number): string | null {
  if (denominator === 0) return null;
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function salesSnapshot(config: DivisionConfig): DivisionSnapshot {
  const leads = listLeads();
  const responseMinutes = leads.filter((l) => l.respondedAt).map((l) => minutesBetween(new Date(l.createdAt), new Date(l.respondedAt as string)));
  const turnaroundHours = leads
    .filter((l) => l.quoteSentAt)
    .map((l) => minutesBetween(new Date(l.createdAt), new Date(l.quoteSentAt as string)) / 60);
  const quoted = leads.filter((l) => l.quoteSentAt);
  const won = quoted.filter((l) => l.stage === "accepted" || l.stage === "deposit_pending" || l.stage === "scheduled");
  const pipelineValue = leads
    .filter((l) => l.stage !== "lost_closed")
    .reduce((sum, l) => sum + (l.quoteValue ?? 0), 0);

  const medianResponse = median(responseMinutes);
  const medianTurnaround = median(turnaroundHours);

  return {
    config,
    kpis: [
      { label: "Lead response time", value: medianResponse !== null ? `${Math.round(medianResponse)} min (median)` : null },
      { label: "Quote turnaround", value: medianTurnaround !== null ? `${medianTurnaround.toFixed(1)} hrs (median)` : null },
      { label: "Quote conversion", value: percent(won.length, quoted.length) },
      { label: "Pipeline value", value: currency(pipelineValue) },
      { label: "Forecast accuracy", value: null }
    ],
    alerts: [{ label: "Leads outside SLA", count: leadsOutsideSla().length, href: "/sales" }],
    workQueueCount: leadsOutsideSla().length,
    note: null
  };
}

function operationsSnapshot(config: DivisionConfig): DivisionSnapshot {
  const jobs = listJobs();
  const atRisk = jobsAtRisk();
  const onTrack = jobs.length - atRisk.length;

  return {
    config,
    kpis: [
      { label: "On-time completion", value: null },
      { label: "Crew utilization", value: null },
      { label: "First-time quality", value: null },
      { label: "Schedule adherence", value: percent(onTrack, jobs.length) },
      { label: "Job profitability", value: null }
    ],
    alerts: [
      { label: "Jobs at risk / blocked", count: atRisk.length, href: "/operations" },
      { label: "Missing closeout", count: jobsWithMissingCloseout().length, href: "/operations" }
    ],
    workQueueCount: atRisk.length + jobsWithMissingCloseout().length,
    note: null
  };
}

function financeSnapshot(config: DivisionConfig): DivisionSnapshot {
  const items = listAccountingItems();
  const exceptions = accountingExceptions();
  const exceptionsTotal = exceptions.reduce((sum, i) => sum + i.amount, 0);
  const dueSoon = billsDueSoon();

  return {
    config,
    kpis: [
      { label: "Cash flow", value: null },
      { label: "Gross margin", value: null },
      { label: "A/R aging (open exceptions)", value: exceptions.length ? currency(exceptionsTotal) : "$0" },
      { label: "Net profit", value: null },
      { label: "Budget vs actual", value: null }
    ],
    alerts: [
      { label: "Bills due soon", count: dueSoon.length, href: "/accounting" },
      { label: "Exceptions", count: exceptions.length, href: "/accounting" }
    ],
    workQueueCount: dueSoon.length + exceptions.length,
    note: items.length === 0 ? "No accounting items seeded yet." : null
  };
}

function safetySnapshot(config: DivisionConfig): DivisionSnapshot {
  const requirements = listSafetyRequirements();
  const jsa = requirements.filter((r) => r.type === "daily_jsa");
  const inspections = requirements.filter((r) => r.type === "ladder_inspection");
  const jsaComplete = jsa.filter((r) => r.status === "submitted");
  const inspectionsComplete = inspections.filter((r) => r.status === "submitted");

  return {
    config,
    kpis: [
      { label: "JSA completion", value: percent(jsaComplete.length, jsa.length) },
      { label: "Training compliance", value: null },
      { label: "Inspection compliance", value: percent(inspectionsComplete.length, inspections.length) },
      { label: "Incident rate", value: null },
      { label: "Corrective-action closure", value: null }
    ],
    alerts: [{ label: "Missing / escalated evidence", count: safetyEvidenceMissingCount(), href: "/safety" }],
    workQueueCount: safetyEvidenceMissingCount(),
    note: null
  };
}

function customerExperienceSnapshot(config: DivisionConfig): DivisionSnapshot {
  const cases = listCustomerCases();
  const open = openCustomerCases();
  const needsTechReview = cases.filter((c) => c.status === "needs_technician_review");

  return {
    config,
    kpis: [
      { label: "Customer satisfaction", value: null },
      { label: "Review score", value: null },
      { label: "Referral rate", value: null },
      { label: "Warranty response time", value: null },
      { label: "Retention/renewal rate", value: null }
    ],
    alerts: [
      { label: "Open cases", count: open.length, href: "/customers" },
      { label: "Needs technician review", count: needsTechReview.length, href: "/customers" }
    ],
    workQueueCount: open.length,
    note: null
  };
}

function executiveIntelligenceSnapshot(config: DivisionConfig): DivisionSnapshot {
  const pending = listProposals({ status: "pending" });
  const clarification = listProposals({ status: "clarification_requested" });
  const urgentPending = pending.filter((p) => p.urgency === "urgent").length;
  const top3 = top3Recommendations();

  return {
    config,
    kpis: [
      { label: "Urgent exceptions", value: String(urgentPending) },
      { label: "Pending approvals", value: String(pending.length + clarification.length) },
      { label: "Jobs at risk", value: String(jobsAtRisk().length) },
      { label: "Leads outside SLA", value: String(leadsOutsideSla().length) },
      { label: "Bills due soon", value: String(billsDueSoon().length) }
    ],
    alerts: [],
    workQueueCount: top3.length,
    note: null
  };
}

/** Divisions with no wired repository yet — competitor signals under Sales are surfaced as a preview only. */
function mockedSnapshot(config: DivisionConfig): DivisionSnapshot {
  return {
    config,
    kpis: config.kpiLabels.map((label) => ({ label, value: null })),
    alerts: [],
    workQueueCount: 0,
    note: `${config.label} is not yet implemented as a division module (03_GAP_ANALYSIS.md). No data source is wired; nothing below is fabricated.`
  };
}

export function divisionSnapshot(key: DivisionKey): DivisionSnapshot | undefined {
  const config = getDivisionConfig(key);
  if (!config) return undefined;
  switch (key) {
    case "sales":
      return salesSnapshot(config);
    case "operations":
      return operationsSnapshot(config);
    case "finance":
      return financeSnapshot(config);
    case "safety":
      return safetySnapshot(config);
    case "customer_experience":
      return customerExperienceSnapshot(config);
    case "executive_intelligence":
      return executiveIntelligenceSnapshot(config);
    case "marketing":
    case "administration":
    default:
      return mockedSnapshot(config);
  }
}

/** Marketing has no division module yet, but Sales already sources real competitor intelligence — surface it as a labeled preview. */
export function marketingIntelligencePreview() {
  return competitorSignals();
}

export function allDivisionSnapshots(): DivisionSnapshot[] {
  return DIVISIONS.map((d) => divisionSnapshot(d.key)).filter((s): s is DivisionSnapshot => Boolean(s));
}

const DIVISION_TO_RECOMMENDATION_CATEGORY: Partial<Record<DivisionKey, RecommendationCategory>> = {
  sales: "sales",
  operations: "operations",
  finance: "financial",
  safety: "safety",
  customer_experience: "customer",
  administration: "admin"
};

/** AI Recommendations section of the Universal Division Workspace. Executive Intelligence sees the company-wide Top 3; Marketing has no category mapping yet (no recommendations are ever fabricated for it). */
export function recommendationsForDivision(key: DivisionKey): Recommendation[] {
  if (key === "executive_intelligence") return top3Recommendations();
  const category = DIVISION_TO_RECOMMENDATION_CATEGORY[key];
  if (!category) return [];
  return listRecommendations().filter((r) => r.category === category && r.status !== "dismissed" && r.status !== "resolved");
}

/** Reverse of the category map above — used by the unified Work Queue (src/repositories/work-queue.ts) to place an approval proposal into its division. */
export function divisionForRecommendationCategory(category: RecommendationCategory): DivisionKey | null {
  const entry = (Object.entries(DIVISION_TO_RECOMMENDATION_CATEGORY) as [DivisionKey, RecommendationCategory][]).find(
    ([, c]) => c === category
  );
  return entry ? entry[0] : null;
}

/** Maps a "Nothing Left Behind" tracked item's `area` label to a division key. */
export function divisionForTrackedArea(area: string): DivisionKey | null {
  const map: Record<string, DivisionKey> = {
    Sales: "sales",
    Operations: "operations",
    Safety: "safety",
    Accounting: "finance",
    Customers: "customer_experience",
    Voice: "customer_experience"
  };
  return map[area] ?? null;
}
