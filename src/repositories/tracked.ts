// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * "Nothing Left Behind" — everything that requires eventual attention but
 * isn't currently one of Cohen's Top 3. This is a trust mechanism as much as
 * a worklist: Cohen decides what deserves immediate attention, but a human
 * can always independently verify that lower-ranked work hasn't silently
 * disappeared (V2 spec, "Nothing Left Behind").
 *
 * Every item is classified into exactly one bucket, in this priority order:
 *   overdue > unassigned > waiting > missing_info > upcoming
 * so the same underlying record never double-counts across categories.
 */

import { getStore } from "@/data/store";
import { isPast, now } from "@/lib/dates";
import { top3Recommendations } from "./recommendations";

export type TrackedCategory = "overdue" | "waiting" | "missing_info" | "unassigned" | "upcoming";

export interface TrackedItem {
  id: string;
  category: TrackedCategory;
  area: string;
  title: string;
  detail: string;
  dueAt: string | null;
  href: string;
}

const CATEGORY_ORDER: TrackedCategory[] = ["overdue", "unassigned", "waiting", "missing_info", "upcoming"];

export const TRACKED_CATEGORY_LABELS: Record<TrackedCategory, string> = {
  overdue: "Overdue",
  waiting: "Waiting on someone",
  missing_info: "Missing information",
  unassigned: "Unassigned",
  upcoming: "Upcoming"
};

export const TRACKED_CATEGORY_ICONS: Record<TrackedCategory, string> = {
  overdue: "🔴",
  waiting: "🟠",
  missing_info: "🟡",
  unassigned: "⚪",
  upcoming: "🔵"
};

/** Entity refs already carried by an active Top 3 card — never double-list those here. */
function top3EntityRefs(): Set<string> {
  const refs = new Set<string>();
  for (const rec of top3Recommendations()) {
    if (rec.linkedEntity) refs.add(`${rec.linkedEntity.type}:${rec.linkedEntity.id}`);
  }
  return refs;
}

export function trackedItems(reference: Date = now()): TrackedItem[] {
  const store = getStore();
  const excluded = top3EntityRefs();
  const items: TrackedItem[] = [];

  // Job requirements — equipment, materials, notes, photos, model numbers, closeout.
  for (const r of store.jobRequirements) {
    if (r.status === "satisfied") continue;
    if (excluded.has(`job:${r.jobId}`)) continue;
    const job = store.jobs.find((j) => j.id === r.jobId);
    const label = job ? `${job.customerName} — ${r.description}` : r.description;
    const overdue = r.requiredBy ? isPast(r.requiredBy, reference) : false;
    let category: TrackedCategory;
    if (overdue) category = "overdue";
    else if (r.status === "missing") category = "missing_info";
    else category = "waiting"; // pending: owned, in progress, not yet done
    items.push({
      id: `req:${r.id}`,
      category,
      area: "Operations",
      title: label,
      detail: overdue ? "Past its required-by time, still not satisfied." : `Status: ${r.status}.`,
      dueAt: r.requiredBy,
      href: `/operations/${r.jobId}`
    });
  }

  // Safety requirements — daily JSA, ladder inspections.
  for (const s of store.safetyRequirements) {
    if (s.status === "submitted") continue;
    if (excluded.has(`job:${s.jobId}`)) continue;
    let category: TrackedCategory;
    if (s.status === "escalated") category = "overdue";
    else if (s.status === "missing") category = "missing_info";
    else category = "waiting"; // reminded — waiting on the assignee to submit
    items.push({
      id: `safety:${s.id}`,
      category,
      area: "Safety",
      title: `${s.type === "daily_jsa" ? "Daily JSA" : "Ladder inspection"} — ${s.assigneeName}`,
      detail: `Status: ${s.status}.`,
      dueAt: s.dueAt,
      href: "/safety"
    });
  }

  // Accounting — bills, invoices, statements.
  for (const a of store.accountingItems) {
    if (a.status === "reconciled" || a.status === "received") continue;
    if (excluded.has(`accounting_item:${a.id}`)) continue;
    let category: TrackedCategory | null = null;
    if (a.status === "overdue") category = "overdue";
    else if (a.duplicateRisk || a.status === "unmatched") category = "missing_info";
    else if (a.status === "awaiting_review") category = "waiting";
    else if (a.dueAt && !isPast(a.dueAt, reference)) category = "upcoming";
    if (!category) continue;
    items.push({
      id: `acct:${a.id}`,
      category,
      area: "Accounting",
      title: `${a.vendorOrCustomerName} — ${a.type.replace("_", " ")}`,
      detail: a.duplicateRisk ? "Possible duplicate — needs cross-check before it's trusted." : `Status: ${a.status}.`,
      dueAt: a.dueAt,
      href: "/accounting"
    });
  }

  // Customer cases.
  for (const c of store.customerCases) {
    if (c.status === "resolved") continue;
    if (excluded.has(`customer_case:${c.id}`)) continue;
    let category: TrackedCategory;
    if (c.nextActionAt && isPast(c.nextActionAt, reference)) category = "overdue";
    else if (c.status === "needs_technician_review") category = "waiting";
    else if (c.nextActionAt) category = "upcoming";
    else category = "waiting";
    items.push({
      id: `case:${c.id}`,
      category,
      area: "Customers",
      title: `${c.customerName} — ${c.category.replace("_", " ")}`,
      detail: c.summary,
      dueAt: c.nextActionAt,
      href: "/customers"
    });
  }

  // Voice calls that were never picked up by anyone.
  for (const v of store.voiceCalls) {
    if (v.outcome === "review_needed" && !v.jobberRequestRef) {
      items.push({
        id: `voice:${v.id}`,
        category: "unassigned",
        area: "Voice",
        title: `${v.contactName} — call needs review`,
        detail: "No one has picked this call up yet.",
        dueAt: null,
        href: "/voice"
      });
    }
  }

  // Stale sales leads sitting without a next touch.
  for (const l of store.leads) {
    if (l.score !== "stale") continue;
    if (excluded.has(`lead:${l.id}`)) continue;
    items.push({
      id: `lead:${l.id}`,
      category: "waiting",
      area: "Sales",
      title: `${l.customerName} — ${l.nextAction}`,
      detail: "Sitting since its last touch with no reply yet.",
      dueAt: l.slaDueAt,
      href: "/sales"
    });
  }

  return items.sort((a, b) => {
    const byCategory = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (byCategory !== 0) return byCategory;
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });
}

export interface TrackedCounts {
  total: number;
  overdue: number;
  waiting: number;
  missing_info: number;
  unassigned: number;
  upcoming: number;
}

export function trackedCounts(items: TrackedItem[] = trackedItems()): TrackedCounts {
  return {
    total: items.length,
    overdue: items.filter((i) => i.category === "overdue").length,
    waiting: items.filter((i) => i.category === "waiting").length,
    missing_info: items.filter((i) => i.category === "missing_info").length,
    unassigned: items.filter((i) => i.category === "unassigned").length,
    upcoming: items.filter((i) => i.category === "upcoming").length
  };
}
