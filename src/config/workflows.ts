/**
 * Workflow registry. Source: 01_MASTER_SPEC.md "Canonical workflows" and
 * the Valley River-specific timing rules scattered through "Divisions and
 * agents". This is a *registry* of workflow definitions — it documents
 * what each workflow is and whether this build's logic actually implements
 * it, with file references. It is not yet a runtime orchestrator that
 * routes published events (src/events/bus.ts) to registered workflow
 * handlers; that remains open (see BUILD_STATUS_V2.md Milestone 9).
 *
 * `status: "active"` means the described behavior is implemented today by
 * existing v1 logic (cited in `implementation`), just not through a formal
 * workflow-engine dispatch loop yet. `status: "inactive"` means only the
 * definition exists — no code implements it yet, and nothing fabricates
 * that it does.
 */

import type { WorkflowDefinition } from "@/domain/events";

const TENANT_ID = "vrhp";

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf_lead_to_job",
    tenantId: TENANT_ID,
    key: "lead_to_job",
    name: "Lead-to-job",
    description:
      "lead.created -> Sales intake -> classify/assign -> SLA -> estimate/quote -> follow-up -> quote.accepted -> deposit check -> operations readiness. Valley River: business-day lead response <=60 min; quotes normally <=24h, max 48h; Jobber auto follow-up after 2 days; manual follow-up day 3-4; accepted quote + ~50% deposit drive downstream readiness.",
    triggerType: "event",
    triggerEventType: "lead.created",
    ownerDivision: "sales",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "active"
  },
  {
    id: "wf_job_readiness",
    tenantId: TENANT_ID,
    key: "job_readiness",
    name: "Job readiness",
    description:
      "quote.accepted/deposit.received -> extract equipment/materials -> add standard materials -> inventory/data confidence -> procurement/shipping tasks -> verify >=3 business days before job -> exception to Operations Manager/Cohen.",
    triggerType: "event",
    triggerEventType: "deposit.received",
    ownerDivision: "operations",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "active"
  },
  {
    id: "wf_closeout",
    tenantId: TENANT_ID,
    key: "closeout",
    name: "Closeout",
    description:
      "job.completed -> 4:00 PM verify CompanyCam photos/model numbers -> complete -> invoicing path; missing -> exception/escalation.",
    triggerType: "schedule",
    triggerEventType: null,
    ownerDivision: "operations",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "active"
  },
  {
    id: "wf_jsa",
    tenantId: TENANT_ID,
    key: "jsa_cadence",
    name: "JSA (daily safety evidence)",
    description:
      "Workday/job trigger -> request evidence -> verify -> 4:00 PM reminder -> 4:30 PM Cohen escalation -> store -> daily roll-up -> monthly ladder inspection reminder. Valley River: Monday-Friday, primary Al, designee Aiden Brennan.",
    triggerType: "schedule",
    triggerEventType: null,
    ownerDivision: "safety",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "active"
  },
  {
    id: "wf_vendor_ap",
    tenantId: TENANT_ID,
    key: "vendor_ap",
    name: "Vendor / AP",
    description:
      "Invoice in authorized email -> extract vendor/date/amount/due -> duplicate/confidence checks -> draft/create QBO bill within permission -> 3-business-day reminder -> statement cross-check -> never initiate bank payment.",
    triggerType: "event",
    triggerEventType: "invoice.received",
    ownerDivision: "finance",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "active"
  },
  {
    id: "wf_marketing_campaign_factory",
    tenantId: TENANT_ID,
    key: "marketing_campaign_factory",
    name: "Marketing campaign factory",
    description:
      "Market scan -> competitor/incentive intelligence -> opportunity score -> campaign concept -> offer/claims check -> content + creative draft -> Brand Guardian -> Marketing Manager -> Approval Center -> approved publishing workflow -> measurement -> outcome/learning.",
    triggerType: "event",
    triggerEventType: "competitor.promotion_detected",
    ownerDivision: "marketing",
    versions: [{ version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." }],
    currentVersion: 1,
    status: "inactive"
  },
  {
    id: "wf_executive_loop",
    tenantId: TENANT_ID,
    key: "executive_loop",
    name: "Executive loop",
    description:
      "Monitor -> Analyze -> Recommend -> policy evaluation -> Execute or request approval -> Observe -> Measure -> decision/outcome record -> proposed learning. Only the 'decision/outcome record' step is implemented today: every resolved approval is dispatched here (src/events/dispatcher.ts) and recorded as institutional memory (src/repositories/decisions.ts). Monitor/Analyze/Recommend/forecast/proposed-learning are not — see BUILD_STATUS_V2.md.",
    triggerType: "event",
    triggerEventType: "approval.resolved",
    ownerDivision: "executive_intelligence",
    versions: [
      { version: 1, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Initial definition." },
      { version: 2, createdAt: "2024-01-01T00:00:00.000Z", changeSummary: "Wired to approval.resolved events; decision-recording step implemented." }
    ],
    currentVersion: 2,
    status: "active"
  }
];

export function getWorkflow(key: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.key === key);
}
