/**
 * Sanitized external-developer seed dataset (Phase 3A —
 * PRODUCTION_READINESS_CHECKLIST.md Lane 1, "sanitized generic seed
 * dataset for external-developer local dev"). Same shape and entity
 * coverage as ./seed.ts (the flagship tenant's real demo dataset), with
 * every customer name, staff name, vendor/supplier name, and place name
 * replaced by a fictional equivalent — no flagship-tenant confidential
 * information (real customers, staff, vendors, or service area) appears
 * below. Selected via AGENTOS_SEED_DATASET=external-dev
 * (src/data/store.ts); the default remains ./seed.ts, so this file
 * changes no default behavior. See HUMAN_DEVELOPER_HANDOFF.md.
 */

import type {
  AccountingItem,
  ActionProposal,
  Agent,
  AgentRun,
  ApprovalDecision,
  CustomerCase,
  EquipmentItem,
  Finding,
  IntegrationSettings,
  Job,
  JobRequirement,
  KnowledgeItem,
  Lead,
  Notification,
  Recommendation,
  SafetyRequirement,
  SourceRecord,
  User,
  VoiceCall
} from "@/domain";
import { businessDaysFromNow, daysAgo, hoursAgo, hoursFromNow, todayAt, toISO } from "@/lib/dates";
import { assertProposalIsPermitted, ApprovalPolicyError } from "@/approvals/engine";
import { recordEvent } from "@/audit/log";
import { jsaCadenceStatus } from "@/lib/jsa-cadence";
import { getTenantConfig } from "@/config/tenant";

/** Cascade Home Comfort's configured lead-response SLA (tenant setting, not a platform constant). */
const SALES_SLA_MINUTES = getTenantConfig().salesResponseSlaMinutes;
const SALES_SLA_HOURS = SALES_SLA_MINUTES / 60;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
// Fictional roster for local development only — not real people, not
// real credentials.

export const users: User[] = [
  {
    id: "u_owner",
    name: "Jordan",
    role: "owner",
    status: "active",
    notificationPreferences: { channels: ["push", "in_app", "email"], bundleNonUrgent: true }
  },
  {
    id: "u_morgan",
    name: "Morgan",
    role: "administrator",
    status: "active",
    notificationPreferences: { channels: ["in_app", "email"], bundleNonUrgent: true }
  },
  {
    id: "u_sam",
    name: "Sam",
    role: "install_manager",
    status: "active",
    notificationPreferences: { channels: ["push", "in_app"], bundleNonUrgent: false }
  },
  {
    id: "u_riley",
    name: "Riley Chen",
    role: "staff",
    status: "active",
    notificationPreferences: { channels: ["in_app"], bundleNonUrgent: true }
  }
];

// ---------------------------------------------------------------------------
// Source records (evidence)
// ---------------------------------------------------------------------------

export const sourceRecords: SourceRecord[] = [
  { id: "src_jobber_job_2048", integration: "jobber", externalId: "2048", entityType: "job", canonicalRef: "jobber:job_2048", syncedAt: toISO(hoursAgo(1)), sourceUrl: null },
  { id: "src_jobber_est_2048", integration: "jobber", externalId: "estimate_2048", entityType: "estimate", canonicalRef: "jobber:estimate_2048", syncedAt: toISO(hoursAgo(1)), sourceUrl: null },
  { id: "src_ops_req_8801", integration: "jobber", externalId: "req_8801", entityType: "job_requirement", canonicalRef: "ops:req_8801", syncedAt: toISO(hoursAgo(1)), sourceUrl: null },
  { id: "src_jobber_quote_7781", integration: "jobber", externalId: "7781", entityType: "quote", canonicalRef: "jobber:quote_7781", syncedAt: toISO(hoursAgo(2)), sourceUrl: null },
  { id: "src_jobber_request_5510", integration: "jobber", externalId: "5510", entityType: "request", canonicalRef: "jobber:request_5510", syncedAt: toISO(hoursAgo(1.5)), sourceUrl: null },
  { id: "src_email_991", integration: "email", externalId: "msg_991", entityType: "vendor_invoice", canonicalRef: "email:msg_991", syncedAt: toISO(daysAgo(1)), sourceUrl: null },
  { id: "src_qbo_vendor_arctic", integration: "qbo", externalId: "vendor_arctic", entityType: "vendor", canonicalRef: "qbo:vendor_arctic", syncedAt: toISO(daysAgo(1)), sourceUrl: null },
  { id: "src_companycam_job2048", integration: "companycam", externalId: "proj_2048", entityType: "project", canonicalRef: "companycam:proj_2048", syncedAt: toISO(hoursAgo(20)), sourceUrl: null },
  { id: "src_ringcentral_call_701", integration: "ringcentral", externalId: "701", entityType: "call", canonicalRef: "ringcentral:call_701", syncedAt: toISO(hoursAgo(5)), sourceUrl: null }
];

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export const agents: Agent[] = [
  {
    id: "sales",
    name: "Sales + Lead Agent",
    type: "specialist",
    mission: "Prevent missed leads, slow response and weak follow-up; surface revenue opportunities.",
    status: "monitoring",
    permissionProfileId: "profile_sales_v1",
    systemsRead: ["jobber", "website_forms", "facebook_leads", "google_reviews", "google_calendar"],
    systemsWrite: [],
    schedules: ["lead_sla_monitor (continuous)", "quote_followup_monitor (daily)"],
    lastRunAt: toISO(hoursAgo(0.4)),
    currentTask: "Monitoring lead response SLA and quote follow-up aging",
    openFindingsCount: 0
  },
  {
    id: "operations",
    name: "Operations Agent",
    type: "specialist",
    mission: "Make every approved job ready before crew arrival and complete before office closeout.",
    status: "needs_human",
    permissionProfileId: "profile_operations_v1",
    systemsRead: ["jobber", "companycam"],
    systemsWrite: [],
    schedules: ["job_readiness_check (3 business days before job)", "closeout_check (weekday 16:00)"],
    lastRunAt: toISO(hoursAgo(1)),
    currentTask: "Awaiting supplier shipment confirmation for job 2048",
    openFindingsCount: 0
  },
  {
    id: "safety",
    name: "Safety & Compliance Agent",
    type: "specialist",
    mission: "Ensure daily safety evidence and recurring inspections do not disappear.",
    status: "monitoring",
    permissionProfileId: "profile_safety_v1",
    systemsRead: ["companycam"],
    systemsWrite: [],
    schedules: ["safety_daily_check (weekday 16:00)", "safety_escalation (weekday 16:30)", "ladder_inspection_monitor (monthly)"],
    lastRunAt: toISO(hoursAgo(0.2)),
    currentTask: "Tracking today's JSA submissions",
    openFindingsCount: 0
  },
  {
    id: "accounting",
    name: "Accounting Agent",
    type: "specialist",
    mission: "Prevent missing invoices/bills/deposits and reduce accounting handoff errors.",
    status: "monitoring",
    permissionProfileId: "profile_accounting_v1",
    systemsRead: ["email", "jobber", "qbo"],
    systemsWrite: [],
    schedules: ["bill_due_monitor (daily)", "statement_reconciliation (monthly)"],
    lastRunAt: toISO(hoursAgo(3)),
    currentTask: "Preparing QBO bill data for review",
    openFindingsCount: 0
  },
  {
    id: "customer",
    name: "Customer Experience / Service Agent",
    type: "specialist",
    mission: "Keep customer issues from drifting and produce clean service handoffs.",
    status: "monitoring",
    permissionProfileId: "profile_customer_v1",
    systemsRead: ["jobber", "email"],
    systemsWrite: [],
    schedules: ["case_followup_monitor (continuous)"],
    lastRunAt: toISO(hoursAgo(2)),
    currentTask: "Reviewing open service cases",
    openFindingsCount: 0
  },
  {
    id: "voice",
    name: "Voice Agent",
    type: "specialist",
    mission: "Answer inbound calls, qualify heat-pump leads/service requests and create structured Jobber requests.",
    status: "paused",
    permissionProfileId: "profile_voice_v1",
    systemsRead: ["ringcentral", "jobber", "google_calendar"],
    systemsWrite: [],
    schedules: [],
    lastRunAt: toISO(hoursAgo(5)),
    currentTask: null,
    openFindingsCount: 0,
    recentAccuracyNote: "Paused pending business hours, transfer-number and booking-authority configuration (pending owner configuration)."
  },
  {
    id: "research",
    name: "Research / Marketing Agent",
    type: "specialist",
    mission: "Provide current, fact-checked market intelligence and marketing ideas.",
    status: "monitoring",
    permissionProfileId: "profile_research_v1",
    systemsRead: ["google_reviews", "website_forms"],
    systemsWrite: [],
    schedules: ["competitor_signal_scan (weekly)"],
    lastRunAt: toISO(daysAgo(2)),
    currentTask: "Weekly competitor promotion scan",
    openFindingsCount: 0
  },
  {
    id: "knowledge",
    name: "Knowledge / SOP Agent",
    type: "specialist",
    mission: "Capture owner/team operational knowledge and turn it into durable training/process assets.",
    status: "monitoring",
    permissionProfileId: "profile_knowledge_v1",
    systemsRead: ["knowledge_base"],
    systemsWrite: [],
    schedules: ["sop_capture_review (weekly)"],
    lastRunAt: toISO(daysAgo(1)),
    currentTask: "Drafting SOP candidate from a recent deposit-handling note",
    openFindingsCount: 0
  }
];

export const agentRuns: AgentRun[] = [
  { id: "run_ops_1", agentId: "operations", trigger: "job_readiness_check_due", startedAt: toISO(hoursAgo(1.1)), endedAt: toISO(hoursAgo(1)), status: "completed", inputRefs: ["jobber:job_2048"], outputSummary: "Readiness 82% — outdoor unit shipment unconfirmed.", error: null },
  { id: "run_sales_1", agentId: "sales", trigger: "lead_sla_monitor", startedAt: toISO(hoursAgo(0.5)), endedAt: toISO(hoursAgo(0.4)), status: "completed", inputRefs: ["jobber:request_5510"], outputSummary: `1 lead outside ${SALES_SLA_MINUTES}-minute SLA.`, error: null },
  { id: "run_sales_2", agentId: "sales", trigger: "quote_followup_monitor", startedAt: toISO(hoursAgo(2.1)), endedAt: toISO(hoursAgo(2)), status: "completed", inputRefs: ["jobber:quote_7781"], outputSummary: "Quote 7781 has passed day-3 follow-up window.", error: null },
  { id: "run_safety_1", agentId: "safety", trigger: "safety_daily_check", startedAt: toISO(hoursAgo(0.3)), endedAt: toISO(hoursAgo(0.2)), status: "completed", inputRefs: ["companycam:proj_2048"], outputSummary: "JSA cadence tracked for 1 active job today.", error: null },
  { id: "run_accounting_1", agentId: "accounting", trigger: "bill_due_monitor", startedAt: toISO(hoursAgo(3.1)), endedAt: toISO(hoursAgo(3)), status: "completed", inputRefs: ["email:msg_991", "qbo:vendor_arctic"], outputSummary: "Vendor invoice matched; bill data prepared for review.", error: null },
  { id: "run_knowledge_1", agentId: "knowledge", trigger: "sop_capture_review", startedAt: toISO(daysAgo(1)), endedAt: toISO(daysAgo(1)), status: "completed", inputRefs: [], outputSummary: "Captured deposit e-transfer note as an SOP candidate.", error: null }
];

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export const findings: Finding[] = [
  {
    id: "find_ops_001",
    agentId: "operations",
    findingType: "equipment_unconfirmed",
    severity: "high",
    title: "Outdoor unit shipment not confirmed",
    summary: "Job 2048 is scheduled tomorrow at 8:00 AM. The Nova outdoor unit shipment referenced on the estimate has not been confirmed with the supplier.",
    entityRefs: ["job:job_2048"],
    evidenceRefs: ["jobber:job_2048", "jobber:estimate_2048", "ops:req_8801"],
    confidence: "high",
    detectedAt: toISO(hoursAgo(1)),
    status: "open"
  },
  {
    id: "find_sales_001",
    agentId: "sales",
    findingType: "quote_followup_overdue",
    severity: "high",
    title: "Quote follow-up window passed",
    summary: "Quote 7781 for the Alders install replacement was sent and has passed the day-3/4 manual follow-up window with no customer response.",
    entityRefs: ["lead:lead_1003"],
    evidenceRefs: ["jobber:quote_7781"],
    confidence: "medium",
    detectedAt: toISO(hoursAgo(2)),
    status: "open"
  },
  {
    id: "find_sales_002",
    agentId: "sales",
    findingType: "lead_sla_breach",
    severity: "high",
    title: `New lead outside ${SALES_SLA_MINUTES}-minute response SLA`,
    summary: `A business-day heat-pump install request from Alex Rivera has gone unanswered past the ${SALES_SLA_MINUTES}-minute response target.`,
    entityRefs: ["lead:lead_1001"],
    evidenceRefs: ["jobber:request_5510"],
    confidence: "high",
    detectedAt: toISO(hoursAgo(0.4)),
    status: "open"
  },
  {
    id: "find_accounting_001",
    agentId: "accounting",
    findingType: "vendor_bill_due_soon",
    severity: "normal",
    title: "Vendor bill approaching due date",
    summary: "A Arctic Supply Co invoice was captured from the authorized email inbox and is due within 3 business days.",
    entityRefs: ["accounting:acct_bill_arctic"],
    evidenceRefs: ["email:msg_991", "qbo:vendor_arctic"],
    confidence: "high",
    detectedAt: toISO(hoursAgo(3)),
    status: "open"
  },
  {
    id: "find_customer_001",
    agentId: "customer",
    findingType: "case_needs_next_step",
    severity: "normal",
    title: "Warranty case awaiting technician review",
    summary: "A warranty inquiry needs a technician's review before Cohen can propose a next step — no diagnosis has been made.",
    entityRefs: ["customer_case:case_warranty_1"],
    evidenceRefs: ["jobber:job_2048"],
    confidence: "medium",
    detectedAt: toISO(hoursAgo(6)),
    status: "open"
  },
  {
    id: "find_knowledge_001",
    agentId: "knowledge",
    findingType: "sop_candidate_ready",
    severity: "low",
    title: "Deposit e-transfer SOP candidate ready for review",
    summary: "A recurring note about splitting deposits into multiple e-transfers (bank per-transfer limits) has been captured as a draft SOP.",
    entityRefs: ["knowledge:sop_deposit_etransfer"],
    evidenceRefs: [],
    confidence: "medium",
    detectedAt: toISO(daysAgo(1)),
    status: "open"
  }
];

// ---------------------------------------------------------------------------
// Recommendations (Cohen ranks these at read time — see src/cohen/orchestrate.ts;
// src/data/store.ts calls buildTop3() over this list at startup)
// ---------------------------------------------------------------------------

export const recommendations: Recommendation[] = [
  {
    id: "rec_001",
    cohenRank: null,
    priority: "high",
    category: "operations",
    title: "Confirm equipment for tomorrow's install",
    summary: "The Jobber job is scheduled tomorrow, but the outdoor-unit shipment is not confirmed against the estimate.",
    whyItMatters: "A missed shipment could delay the install and create a same-day customer issue.",
    impact: { type: "risk", label: "Install delay risk" },
    confidence: "high",
    confidenceReason: "Jobber job and equipment checklist agree; shipment confirmation is missing.",
    sourceRefs: ["jobber:job_2048", "ops:req_8801"],
    decisionRequired: "Approve Morgan to contact the supplier / approve the proposed follow-up.",
    dueAt: toISO(todayAt(15, 0)),
    status: "action_pending",
    findingIds: ["find_ops_001"],
    linkedEntity: { type: "job", id: "job_2048" }
  },
  {
    id: "rec_004",
    cohenRank: null,
    priority: "high",
    category: "sales",
    title: "Respond to a lead before the SLA breach compounds",
    summary: `Alex Rivera's install request has gone unanswered past the ${SALES_SLA_MINUTES}-minute business-day response target.`,
    whyItMatters: "Every additional hour of silence lowers the odds of winning a warm, high-intent lead.",
    impact: { type: "revenue", label: "Lead conversion risk" },
    confidence: "high",
    confidenceReason: "Jobber request timestamp and lack of any logged response both confirm the breach.",
    sourceRefs: ["jobber:request_5510"],
    decisionRequired: "Approve the drafted first-response message.",
    dueAt: toISO(hoursAgo(0.5)), // already overdue
    status: "action_pending",
    findingIds: ["find_sales_002"],
    linkedEntity: { type: "lead", id: "lead_1001" }
  },
  {
    id: "rec_002",
    cohenRank: null,
    priority: "high",
    category: "sales",
    title: "Follow up a high-value quote today",
    summary: "A heat-pump installation quote has passed the normal follow-up window with no customer response.",
    whyItMatters: "The opportunity is still active and a timely follow-up may protect the sale.",
    impact: { type: "revenue", label: "Revenue opportunity", value: "$18,500 quote" },
    confidence: "medium",
    confidenceReason: "Jobber shows no response after the most recent quote activity.",
    sourceRefs: ["jobber:quote_7781"],
    decisionRequired: "Approve or edit the follow-up message.",
    dueAt: toISO(todayAt(17, 0)),
    status: "action_pending",
    findingIds: ["find_sales_001"],
    linkedEntity: { type: "lead", id: "lead_1003" }
  },
  {
    id: "rec_003",
    cohenRank: null,
    priority: "normal",
    category: "financial",
    title: "Review vendor bill due in 3 business days",
    summary: "A vendor invoice has been captured and is approaching its due date.",
    whyItMatters: "Reviewing it now reduces the chance of a missed bill or duplicate entry.",
    impact: { type: "financial", label: "Payment timing" },
    confidence: "high",
    confidenceReason: "Invoice email and accounting record reference match.",
    sourceRefs: ["email:msg_991", "qbo:vendor_arctic"],
    decisionRequired: "Review the prepared bill data.",
    dueAt: toISO(businessDaysFromNow(3)),
    status: "surfaced",
    findingIds: ["find_accounting_001"],
    linkedEntity: { type: "accounting_item", id: "acct_bill_arctic" }
  },
  {
    id: "rec_005",
    cohenRank: null,
    priority: "normal",
    category: "customer",
    title: "Warranty case needs a technician-review decision",
    summary: "A customer's warranty inquiry is waiting on a next-step decision.",
    whyItMatters: "The customer is waiting; a clean handoff keeps the case from drifting.",
    impact: { type: "customer", label: "Service backlog" },
    confidence: "medium",
    confidenceReason: "Case details are logged but final diagnosis has not been made by a technician.",
    sourceRefs: ["jobber:job_2048"],
    decisionRequired: "Confirm routing to a technician for review.",
    dueAt: toISO(businessDaysFromNow(1)),
    status: "surfaced",
    findingIds: ["find_customer_001"],
    linkedEntity: { type: "customer_case", id: "case_warranty_1" }
  },
  {
    id: "rec_006",
    cohenRank: null,
    priority: "low",
    category: "admin",
    title: "New SOP candidate awaiting review",
    summary: "A draft SOP on splitting deposits into multiple e-transfers is ready for your review.",
    whyItMatters: "Approving it turns tribal knowledge into a repeatable, transferable process.",
    impact: { type: "time", label: "Admin optimization" },
    confidence: "medium",
    confidenceReason: "Captured from a recurring operating note; not yet human-approved.",
    sourceRefs: [],
    decisionRequired: "Approve, edit, or reject the SOP candidate.",
    dueAt: null,
    status: "surfaced",
    findingIds: ["find_knowledge_001"],
    linkedEntity: undefined
  }
];

// ---------------------------------------------------------------------------
// Action proposals + approval decisions
// ---------------------------------------------------------------------------

export const actionProposals: ActionProposal[] = [
  {
    id: "prop_001",
    recommendationId: "rec_001",
    actionType: "supplier_follow_up_draft",
    description: "Draft a follow-up message to Arctic Supply Co / Continental Freight confirming the outdoor-unit shipment for job 2048, and a note asking Morgan to send it.",
    initiatorAgentId: "operations",
    targetRef: "jobber:job_2048",
    payload: {
      channel: "email",
      to: "orders@arcticsupply.example",
      subject: "Shipment confirmation needed — Job 2048 (install tomorrow)",
      body: "Hi team, can you confirm tracking for the outdoor unit on estimate 2048? Install is scheduled for tomorrow 8:00 AM and we don't yet have a Continental Freight tracking number. Thanks, Cascade Home Comfort."
    },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "pending",
    evidenceRefs: ["jobber:job_2048", "jobber:estimate_2048", "ops:req_8801"],
    confidence: "high",
    urgency: "high",
    riskIfDelayed: "Install may need to be rescheduled if equipment does not arrive in time.",
    impact: { type: "risk", label: "Install delay risk" },
    editable: true,
    createdAt: toISO(hoursAgo(1)),
    expiresAt: toISO(todayAt(17, 0)),
    category: "operations"
  },
  {
    id: "prop_004",
    recommendationId: "rec_004",
    actionType: "customer_first_response_draft",
    description: "Draft a first-response email to Alex Rivera acknowledging her install request and proposing an assessment time.",
    initiatorAgentId: "sales",
    targetRef: "jobber:request_5510",
    payload: {
      channel: "email",
      to: "alex.rivera@example.com",
      subject: "Thanks for reaching out to Cascade Home Comfort",
      body: "Hi Alex, thanks for your interest in a ducted heat-pump install. I'd like to set up a quick assessment — does later this week work? — Morgan, Cascade Home Comfort."
    },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "pending",
    evidenceRefs: ["jobber:request_5510"],
    confidence: "high",
    urgency: "high",
    riskIfDelayed: "Response window continues to widen, lowering conversion odds.",
    impact: { type: "revenue", label: "Lead conversion risk" },
    editable: true,
    createdAt: toISO(hoursAgo(0.4)),
    expiresAt: toISO(todayAt(17, 0)),
    category: "sales"
  },
  {
    id: "prop_002",
    recommendationId: "rec_002",
    actionType: "customer_followup_message_draft",
    description: "Draft a day-3/4 manual follow-up message to Pat & Robin Alders on the outstanding $18,500 quote.",
    initiatorAgentId: "sales",
    targetRef: "jobber:quote_7781",
    payload: {
      channel: "email",
      to: "alders@example.com",
      subject: "Checking in on your heat pump quote",
      body: "Hi Pat and Robin, just checking in on the quote we sent over — happy to answer any questions or adjust anything. — Cascade Home Comfort."
    },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "pending",
    evidenceRefs: ["jobber:quote_7781"],
    confidence: "medium",
    urgency: "high",
    riskIfDelayed: "Opportunity may go cold or the customer may accept a competing quote.",
    impact: { type: "revenue", label: "Revenue opportunity" },
    editable: true,
    createdAt: toISO(hoursAgo(2)),
    expiresAt: toISO(businessDaysFromNow(2)),
    category: "sales"
  },
  {
    id: "prop_003",
    recommendationId: "rec_003",
    actionType: "qbo_bill_prep_review",
    description: "Review the prepared QuickBooks Online bill data for the Arctic Supply Co invoice before it is entered.",
    initiatorAgentId: "accounting",
    targetRef: "qbo:vendor_arctic",
    payload: {
      vendor: "Arctic Supply Co",
      amount: 4820.0,
      dueAt: toISO(businessDaysFromNow(3)),
      memo: "Outdoor + indoor unit set — job 2048, ref estimate 2048"
    },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "pending",
    evidenceRefs: ["email:msg_991", "qbo:vendor_arctic"],
    confidence: "high",
    urgency: "normal",
    riskIfDelayed: "Low near-term risk; still reduces chance of a missed due date or duplicate bill.",
    impact: { type: "financial", label: "Payment timing" },
    editable: false,
    createdAt: toISO(hoursAgo(3)),
    expiresAt: toISO(businessDaysFromNow(3)),
    category: "financial"
  },
  {
    id: "prop_005",
    recommendationId: "rec_006",
    actionType: "sop_publish_review",
    description: "Review and approve the deposit e-transfer SOP candidate before it becomes an active process document.",
    initiatorAgentId: "knowledge",
    targetRef: "knowledge:sop_deposit_etransfer",
    payload: { title: "Splitting deposits across multiple e-transfers", version: 1 },
    permissionClass: "draft",
    approverRole: "owner",
    status: "clarification_requested",
    evidenceRefs: [],
    confidence: "medium",
    urgency: "low",
    riskIfDelayed: "None urgent — administrative optimization only.",
    impact: { type: "time", label: "Admin optimization" },
    editable: true,
    createdAt: toISO(daysAgo(1)),
    expiresAt: null,
    category: "admin"
  },
  {
    id: "prop_hist_001",
    recommendationId: "rec_hist_closeout",
    actionType: "closeout_reminder_task",
    description: "Create an internal reminder task for Sam to submit closeout photos for last week's Fairview install.",
    initiatorAgentId: "operations",
    targetRef: "jobber:job_1990",
    payload: { assignee: "u_sam", note: "Please add closeout photos + model numbers to CompanyCam for job 1990." },
    permissionClass: "draft",
    approverRole: "install_manager",
    status: "approved_simulation",
    evidenceRefs: ["companycam:proj_1990"],
    confidence: "high",
    urgency: "normal",
    riskIfDelayed: "Delayed final invoice to the customer.",
    impact: { type: "time", label: "Closeout timing" },
    editable: false,
    createdAt: toISO(daysAgo(3)),
    expiresAt: null,
    category: "operations"
  },
  {
    id: "prop_hist_002",
    recommendationId: "rec_hist_reviewreply",
    actionType: "customer_review_reply_draft",
    description: "Draft a public reply to a new Google review.",
    initiatorAgentId: "research",
    targetRef: "google_reviews:rev_442",
    payload: { channel: "email", to: "n/a", body: "Thank you so much for the kind words — we'll pass this along to the install crew!" },
    permissionClass: "draft",
    approverRole: "administrator",
    status: "rejected",
    evidenceRefs: ["google_reviews:rev_442"],
    confidence: "medium",
    urgency: "low",
    riskIfDelayed: "None.",
    impact: undefined,
    editable: true,
    createdAt: toISO(daysAgo(2)),
    expiresAt: null,
    category: "admin"
  }
];

export const approvalDecisions: ApprovalDecision[] = [
  {
    id: "dec_hist_001",
    proposalId: "prop_hist_001",
    userId: "u_sam",
    decision: "approved",
    reason: null,
    editedPayload: null,
    decidedAt: toISO(daysAgo(3))
  },
  {
    id: "dec_hist_002",
    proposalId: "prop_hist_002",
    userId: "u_morgan",
    decision: "rejected",
    reason: "I'll reply to this one personally — it mentions a specific crew member by name.",
    editedPayload: null,
    decidedAt: toISO(daysAgo(2))
  }
];

// ---------------------------------------------------------------------------
// Sales — leads
// ---------------------------------------------------------------------------

export const leads: Lead[] = [
  {
    id: "lead_1001",
    source: "jobber",
    customerRef: "customer_rivera",
    customerName: "Alex Rivera",
    serviceType: "Ducted heat pump install",
    createdAt: toISO(hoursAgo(SALES_SLA_HOURS + 0.5)),
    respondedAt: null,
    slaDueAt: toISO(hoursAgo(0.5)),
    stage: "new",
    ownerId: "u_morgan",
    ownerName: "Morgan",
    latestTouch: "Jobber request received",
    nextAction: "Respond now — SLA breached",
    score: "at_risk",
    jobberRef: "request_5510",
    quoteRef: null,
    quoteSentAt: null,
    quoteValue: null
  },
  {
    id: "lead_1002",
    source: "website_forms",
    customerRef: "customer_sutton",
    customerName: "Jamie Sutton",
    serviceType: "Ductless mini-split, 2 zones",
    createdAt: toISO(hoursAgo(0.3)),
    respondedAt: toISO(hoursAgo(0.2)),
    slaDueAt: toISO(hoursAgo(0.3 - SALES_SLA_HOURS)),
    stage: "contacted",
    ownerId: "u_morgan",
    ownerName: "Morgan",
    latestTouch: "Morgan replied to confirm assessment time",
    nextAction: "Schedule assessment",
    score: "hot",
    jobberRef: "request_5512",
    quoteRef: null,
    quoteSentAt: null,
    quoteValue: null
  },
  {
    id: "lead_1003",
    source: "jobber",
    customerRef: "customer_alders",
    customerName: "Pat & Robin Alders",
    serviceType: "Ducted install replacement",
    createdAt: toISO(daysAgo(4)),
    respondedAt: toISO(daysAgo(4)),
    slaDueAt: toISO(daysAgo(4)),
    stage: "follow_up",
    ownerId: "u_morgan",
    ownerName: "Morgan",
    latestTouch: "Quote sent, Jobber auto-follow-up sent day 2",
    nextAction: "Send manual day-3/4 follow-up",
    score: "stale",
    jobberRef: "job_req_4432",
    quoteRef: "quote_7781",
    quoteSentAt: toISO(daysAgo(3)),
    quoteValue: 18500
  },
  {
    id: "lead_1004",
    source: "jobber",
    customerRef: "customer_demo",
    customerName: "Demo Customer",
    serviceType: "Ducted heat pump install",
    createdAt: toISO(daysAgo(10)),
    respondedAt: toISO(daysAgo(10)),
    slaDueAt: toISO(daysAgo(10)),
    stage: "scheduled",
    ownerId: "u_morgan",
    ownerName: "Morgan",
    latestTouch: "Deposit received, job scheduled",
    nextAction: "Operations readiness in progress",
    score: "normal",
    jobberRef: "2048",
    quoteRef: "quote_2001",
    quoteSentAt: toISO(daysAgo(12)),
    quoteValue: 15200
  },
  {
    id: "lead_1005",
    source: "facebook_leads",
    customerRef: "customer_rowe",
    customerName: "Taylor Rowe",
    serviceType: "General inquiry",
    createdAt: toISO(daysAgo(9)),
    respondedAt: toISO(daysAgo(9)),
    slaDueAt: toISO(daysAgo(9)),
    stage: "lost_closed",
    ownerId: "u_morgan",
    ownerName: "Morgan",
    latestTouch: "Went with another contractor",
    nextAction: "None",
    score: "normal",
    jobberRef: null,
    quoteRef: null,
    quoteSentAt: null,
    quoteValue: null
  }
];

// ---------------------------------------------------------------------------
// Operations — jobs, requirements, equipment
// ---------------------------------------------------------------------------

export const jobs: Job[] = [
  {
    id: "job_2048",
    jobberId: "2048",
    customerRef: "customer_demo",
    customerName: "Demo Customer",
    serviceType: "Ducted heat pump install",
    community: "Rivertown",
    scheduledStart: toISO(businessDaysFromNow(1, todayAt(8, 0))),
    crewRefs: ["u_sam", "u_riley"],
    stage: "shipment_pending",
    readinessStatus: "at_risk",
    readinessScore: 82,
    jobberEstimateRef: "estimate_2048",
    openQuestions: ["Outdoor unit shipment not confirmed against the estimate"]
  },
  {
    id: "job_1955",
    jobberId: "1955",
    customerRef: "customer_bowen",
    customerName: "Chris Bowen",
    serviceType: "Ductless mini-split, 2 zones",
    community: "Millbrook",
    scheduledStart: toISO(businessDaysFromNow(4, todayAt(9, 0))),
    crewRefs: ["u_sam"],
    stage: "ready",
    readinessStatus: "ready",
    readinessScore: 100,
    jobberEstimateRef: "estimate_1955",
    openQuestions: []
  },
  {
    id: "job_1990",
    jobberId: "1990",
    customerRef: "customer_fairview",
    customerName: "Fairview Residence",
    serviceType: "Ducted install — closeout",
    community: "Fairview",
    scheduledStart: toISO(daysAgo(5, todayAt(8, 0))),
    crewRefs: ["u_sam", "u_riley"],
    stage: "closeout_missing",
    readinessStatus: "closeout_missing",
    readinessScore: 95,
    jobberEstimateRef: "estimate_1990",
    openQuestions: ["Closeout photos and model numbers not yet in CompanyCam"]
  },
  {
    id: "job_1888",
    jobberId: "1888",
    customerRef: "customer_lakeside",
    customerName: "Lakeside Residence",
    serviceType: "Ducted heat pump install",
    community: "Lakeside",
    scheduledStart: toISO(daysAgo(20, todayAt(8, 0))),
    crewRefs: ["u_sam", "u_riley"],
    stage: "complete",
    readinessStatus: "complete",
    readinessScore: 100,
    jobberEstimateRef: "estimate_1888",
    openQuestions: []
  }
];

export const jobRequirements: JobRequirement[] = [
  { id: "req_8801", jobId: "job_2048", type: "equipment", description: "Confirm outdoor unit shipment with Arctic Supply Co / Continental Freight", requiredBy: toISO(todayAt(15, 0)), status: "missing", ownerRef: "u_morgan", evidenceRef: null },
  { id: "req_8802", jobId: "job_2048", type: "jsa", description: "Daily JSA photo for tomorrow's install crew", requiredBy: toISO(businessDaysFromNow(1, todayAt(16, 0))), status: "pending", ownerRef: "u_sam", evidenceRef: null },
  { id: "req_8803", jobId: "job_2048", type: "note", description: "Confirm customer is home for 8:00 AM start", requiredBy: toISO(todayAt(17, 0)), status: "pending", ownerRef: "u_morgan", evidenceRef: null },
  { id: "req_1990_1", jobId: "job_1990", type: "photo", description: "Closeout install photos", requiredBy: toISO(daysAgo(4, todayAt(16, 0))), status: "missing", ownerRef: "u_sam", evidenceRef: null },
  { id: "req_1990_2", jobId: "job_1990", type: "model_number", description: "Outdoor + indoor unit model numbers", requiredBy: toISO(daysAgo(4, todayAt(16, 0))), status: "missing", ownerRef: "u_sam", evidenceRef: null },
  { id: "req_1955_1", jobId: "job_1955", type: "equipment", description: "Confirm mini-split delivery", requiredBy: toISO(businessDaysFromNow(1)), status: "satisfied", ownerRef: "u_morgan", evidenceRef: "jobber:estimate_1955" }
];

export const equipmentItems: EquipmentItem[] = [
  { id: "equip_2048_1", jobId: "job_2048", sourceEstimateLineRef: "estimate_2048:line_1", manufacturer: "Nova", model: "Flexx 24k Outdoor Unit", quantity: 1, status: "unconfirmed", supplier: "Arctic Supply Co", trackingRef: null },
  { id: "equip_2048_2", jobId: "job_2048", sourceEstimateLineRef: "estimate_2048:line_2", manufacturer: "Nova", model: "Flexx 24k Indoor Air Handler", quantity: 1, status: "confirmed", supplier: "Arctic Supply Co", trackingRef: "CFT-88213-GEN" },
  { id: "equip_1955_1", jobId: "job_1955", sourceEstimateLineRef: "estimate_1955:line_1", manufacturer: "Nova", model: "Multi-18 2-Zone", quantity: 1, status: "delivered", supplier: "Arctic Supply Co", trackingRef: "CFT-87990-GEN" }
];

// ---------------------------------------------------------------------------
// Safety — JSA + inspections
// ---------------------------------------------------------------------------

function todaysJsaStatus(): { status: SafetyRequirement["status"]; escalatedAt: string | null } {
  const status = jsaCadenceStatus(new Date(), todayAt(16, 0), todayAt(16, 30));
  return { status, escalatedAt: status === "escalated" ? toISO(todayAt(16, 30)) : null };
}

const todaysJsa = todaysJsaStatus();

export const safetyRequirements: SafetyRequirement[] = [
  {
    id: "jsa_today_2048",
    jobId: "job_2048",
    type: "daily_jsa",
    assigneeRef: "u_sam",
    assigneeName: "Sam",
    dueAt: toISO(todayAt(16, 0)),
    status: todaysJsa.status,
    evidenceRef: null,
    escalatedAt: todaysJsa.escalatedAt
  },
  {
    id: "jsa_yesterday_1955",
    jobId: "job_1955",
    type: "daily_jsa",
    assigneeRef: "u_riley",
    assigneeName: "Riley Chen",
    dueAt: toISO(daysAgo(1, todayAt(16, 0))),
    status: "submitted",
    evidenceRef: "companycam:jsa_1955_08_27",
    escalatedAt: null
  },
  {
    id: "ladder_inspection_aug",
    jobId: null,
    type: "ladder_inspection",
    assigneeRef: "u_sam",
    assigneeName: "Sam",
    dueAt: toISO(businessDaysFromNow(10)),
    status: "missing",
    evidenceRef: null,
    escalatedAt: null
  }
];

// ---------------------------------------------------------------------------
// Accounting
// ---------------------------------------------------------------------------

export const accountingItems: AccountingItem[] = [
  {
    id: "acct_bill_arctic",
    type: "vendor_bill",
    vendorOrCustomerRef: "qbo:vendor_arctic",
    vendorOrCustomerName: "Arctic Supply Co",
    sourceRef: "email:msg_991",
    amount: 4820.0,
    dueAt: toISO(businessDaysFromNow(3)),
    status: "prepared",
    qboRef: "bill_qbo_881",
    duplicateRisk: false
  },
  {
    id: "acct_deposit_1004",
    type: "deposit",
    vendorOrCustomerRef: "customer_demo",
    vendorOrCustomerName: "Demo Customer",
    sourceRef: "jobber:2048",
    amount: 7600.0,
    dueAt: null,
    status: "received",
    qboRef: null,
    duplicateRisk: false
  },
  {
    id: "acct_deposit_1003",
    type: "deposit",
    vendorOrCustomerRef: "customer_alders",
    vendorOrCustomerName: "Pat & Robin Alders",
    sourceRef: "jobber:quote_7781",
    amount: 9250.0,
    dueAt: null,
    status: "expected",
    qboRef: null,
    duplicateRisk: false
  },
  {
    id: "acct_invoice_1888",
    type: "customer_invoice",
    vendorOrCustomerRef: "customer_lakeside",
    vendorOrCustomerName: "Lakeside Residence",
    sourceRef: "jobber:1888",
    amount: 13400.0,
    dueAt: null,
    status: "awaiting_review",
    qboRef: null,
    duplicateRisk: false
  },
  {
    id: "acct_statement_buildright",
    type: "statement",
    vendorOrCustomerRef: "vendor_buildright",
    vendorOrCustomerName: "BuildRight Supply",
    sourceRef: "email:statement_aug",
    amount: 2110.55,
    dueAt: toISO(businessDaysFromNow(6)),
    status: "awaiting_review",
    qboRef: null,
    duplicateRisk: true
  }
];

// ---------------------------------------------------------------------------
// Customer / service
// ---------------------------------------------------------------------------

export const customerCases: CustomerCase[] = [
  {
    id: "case_warranty_1",
    customerRef: "customer_demo",
    customerName: "Demo Customer",
    jobRef: "job_2048",
    category: "warranty",
    severity: "normal",
    status: "needs_technician_review",
    summary: "Customer reports an unusual sound from the indoor unit installed last season. Needs technician review — no diagnosis made yet.",
    nextActionAt: toISO(businessDaysFromNow(1)),
    ownerRef: "u_sam"
  },
  {
    id: "case_general_1",
    customerRef: "customer_bowen",
    customerName: "Chris Bowen",
    jobRef: "job_1955",
    category: "general_question",
    severity: "low",
    status: "resolved",
    summary: "Asked about filter replacement cadence. Answered with manufacturer guidance.",
    nextActionAt: null,
    ownerRef: "u_morgan"
  },
  {
    id: "case_complaint_1",
    customerRef: "customer_fairview",
    customerName: "Fairview Residence",
    jobRef: "job_1990",
    category: "escalated_complaint",
    severity: "high",
    status: "in_progress",
    summary: "Customer is asking for closeout paperwork and final invoice; escalated because it has been outstanding since job completion.",
    nextActionAt: toISO(hoursFromNow(4)),
    ownerRef: "u_morgan"
  }
];

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------

export const voiceCalls: VoiceCall[] = [
  {
    id: "call_701",
    providerCallId: "701",
    direction: "inbound",
    contactRef: "customer_sutton",
    contactName: "Jamie Sutton",
    startedAt: toISO(hoursAgo(5)),
    outcome: "jobber_request_created",
    urgency: "normal",
    consentRef: "consent_call_701",
    jobberRequestRef: "request_5512",
    transcriptRef: "ringcentral:call_701:transcript"
  },
  {
    id: "call_699",
    providerCallId: "699",
    direction: "inbound",
    contactRef: "unknown_caller_1",
    contactName: "Unknown caller",
    startedAt: toISO(daysAgo(1)),
    outcome: "transferred",
    urgency: "urgent",
    consentRef: null,
    jobberRequestRef: null,
    transcriptRef: "ringcentral:call_699:transcript"
  },
  {
    id: "call_690",
    providerCallId: "690",
    direction: "inbound",
    contactRef: "customer_generic_1",
    contactName: "Prospective customer",
    startedAt: toISO(daysAgo(2)),
    outcome: "review_needed",
    urgency: "normal",
    consentRef: "consent_call_690",
    jobberRequestRef: null,
    transcriptRef: "ringcentral:call_690:transcript"
  }
];

// ---------------------------------------------------------------------------
// Knowledge / SOP
// ---------------------------------------------------------------------------

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: "note_deposit_etransfer",
    type: "note",
    title: "Deposits sometimes need to be split across e-transfers",
    content: "Owner noted that a 50% deposit can exceed a customer's single e-transfer limit, requiring more than one transfer to complete the deposit.",
    sourceRefs: [],
    status: "approved",
    version: 1,
    approvedBy: "u_owner",
    approvedAt: toISO(daysAgo(30))
  },
  {
    id: "sop_deposit_etransfer",
    type: "proposed_sop",
    title: "SOP: Splitting deposits across multiple e-transfers",
    content: "When a customer's e-transfer limit is lower than the deposit amount, ask for the deposit in two (or more) transfers and confirm both before scheduling equipment.",
    sourceRefs: ["knowledge:note_deposit_etransfer"],
    status: "pending_review",
    version: 1,
    approvedBy: null,
    approvedAt: null
  },
  {
    id: "sop_jsa_cadence",
    type: "approved_sop",
    title: "SOP: Daily JSA evidence",
    content: "One designated crew member per job submits a JSA photo Monday-Friday. Reminder at 4:00 PM; unresolved items escalate to Cohen at 4:30 PM.",
    sourceRefs: [],
    status: "approved",
    version: 2,
    approvedBy: "u_owner",
    approvedAt: toISO(daysAgo(45))
  }
];

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const integrationSettings: IntegrationSettings[] = [
  { id: "jobber", label: "Jobber", tier: 1, connected: true, readCapabilities: ["clients", "properties", "requests", "quotes", "jobs", "invoices"], writeCapabilities: [], permissionScope: "Read only (demo mock)", lastSyncAt: toISO(hoursAgo(1)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "qbo", label: "QuickBooks Online", tier: 1, connected: true, readCapabilities: ["vendors", "bills", "invoices", "payments", "items"], writeCapabilities: [], permissionScope: "Read only (demo mock)", lastSyncAt: toISO(daysAgo(1)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "google_calendar", label: "Google Calendar", tier: 1, connected: true, readCapabilities: ["availability", "schedule_conflicts"], writeCapabilities: [], permissionScope: "Read only (demo mock)", lastSyncAt: toISO(hoursAgo(4)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "ringcentral", label: "RingCentral", tier: 1, connected: true, readCapabilities: ["call_metadata", "transfer_routing"], writeCapabilities: [], permissionScope: "Read only (demo mock)", lastSyncAt: toISO(hoursAgo(5)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "companycam", label: "CompanyCam", tier: "supporting", connected: true, readCapabilities: ["photos", "model_numbers"], writeCapabilities: [], permissionScope: "Read only (demo mock)", lastSyncAt: toISO(hoursAgo(20)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "email", label: "Authorized email inbox", tier: "supporting", connected: true, readCapabilities: ["vendor_invoices", "customer_threads"], writeCapabilities: [], permissionScope: "Read + draft only (no autonomous send)", lastSyncAt: toISO(daysAgo(1)), health: "ok", healthMessage: "Mock adapter healthy — demo mode." },
  { id: "website_forms", label: "Website forms", tier: 2, connected: false, readCapabilities: ["form_submissions"], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "Not connected yet." },
  { id: "facebook_leads", label: "Facebook leads", tier: 2, connected: false, readCapabilities: ["lead_opportunities"], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "Not connected yet." },
  { id: "google_reviews", label: "Google reviews", tier: 2, connected: false, readCapabilities: ["reviews"], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "Not connected yet." },
  { id: "knowledge_base", label: "Knowledge base", tier: "supporting", connected: true, readCapabilities: ["notes", "sops"], writeCapabilities: [], permissionScope: "Internal store", lastSyncAt: toISO(daysAgo(1)), health: "ok", healthMessage: "Internal — always available." },
  { id: "sortly", label: "Sortly", tier: 2, connected: false, readCapabilities: [], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "BLOCKED_EXTERNAL — no credentials configured; no confirmed API capability implemented yet." },
  { id: "google_drive", label: "Google Drive", tier: 2, connected: false, readCapabilities: [], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "BLOCKED_EXTERNAL — no credentials configured; no confirmed API capability implemented yet." },
  { id: "canva", label: "Canva", tier: 2, connected: false, readCapabilities: [], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "BLOCKED_EXTERNAL — draft/creative adapter for the Marketing division, not yet implemented. Never a bypass around approval policy even once connected (01_MASTER_SPEC.md)." },
  { id: "meta_ads", label: "Meta advertising", tier: 2, connected: false, readCapabilities: [], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "BLOCKED_EXTERNAL — no credentials configured; publishing would remain approval-gated even once connected." },
  { id: "google_ads", label: "Google advertising", tier: 2, connected: false, readCapabilities: [], writeCapabilities: [], permissionScope: "Not configured", lastSyncAt: null, health: "not_configured", healthMessage: "BLOCKED_EXTERNAL — no credentials configured; publishing would remain approval-gated even once connected." }
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications: Notification[] = [
  {
    id: "notif_1",
    recipientId: "u_owner",
    priority: "high",
    title: "Lead response SLA breached",
    body: `Alex Rivera's request has gone unanswered past the ${SALES_SLA_MINUTES}-minute target.`,
    recommendationId: "rec_004",
    channel: "push",
    status: "delivered",
    createdAt: toISO(hoursAgo(0.4)),
    deliveredAt: toISO(hoursAgo(0.4))
  },
  {
    id: "notif_2",
    recipientId: "u_owner",
    priority: "normal",
    title: "Cohen's Top 3 for today",
    body: "3 decisions worth your attention this morning.",
    recommendationId: null,
    channel: "in_app",
    status: "read",
    createdAt: toISO(hoursAgo(3)),
    deliveredAt: toISO(hoursAgo(3))
  }
];

// ---------------------------------------------------------------------------
// Guardrail demonstration: this actually exercises the real policy guard at
// startup (src/approvals/engine.ts) rather than hard-coding a narrative
// string, and records the result to the audit trail (AT-03).
// ---------------------------------------------------------------------------

export function recordGuardrailProofOfConcept(): void {
  try {
    assertProposalIsPermitted({ actionType: "pay_bill", permissionClass: "prohibited" });
  } catch (err) {
    if (err instanceof ApprovalPolicyError) {
      recordEvent({
        actorType: "system",
        actorId: "approval_engine",
        eventType: "guardrail.blocked",
        entityType: "action_proposal",
        entityId: "n/a",
        summary: 'A proposed action of type "pay_bill" was blocked at creation — banking and money-movement actions are prohibited in AgentOS v1 (Level 2 authority).',
        metadata: { actionType: "pay_bill", permissionClass: "prohibited" }
      });
    }
  }
}
