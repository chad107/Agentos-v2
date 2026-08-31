/**
 * Core domain entities. Source: 07_DATA_MODEL.md.
 *
 * These are normalized, UI/orchestration-facing types — not vendor SDK
 * objects. Adapter code (src/integrations) is responsible for translating
 * vendor payloads into these shapes; domain and UI code never imports a
 * vendor SDK type directly (02_SYSTEM_ARCHITECTURE.md, "adapter layer").
 */

import type {
  AgentStatus,
  AuditActorType,
  ConfidenceLevel,
  ImpactType,
  JobReadinessStatus,
  NotificationChannel,
  PermissionClass,
  PriorityLevel,
  ProposalStatus,
  RecommendationCategory,
  RecommendationStatus,
  UserRole
} from "./enums";

export type ISODateTime = string;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  status: "active" | "invited" | "suspended";
  notificationPreferences: {
    channels: NotificationChannel[];
    bundleNonUrgent: boolean;
  };
}

export type AgentId =
  | "sales"
  | "operations"
  | "safety"
  | "accounting"
  | "customer"
  | "voice"
  | "research"
  | "knowledge";

export interface Agent {
  id: AgentId;
  name: string;
  type: string;
  mission: string;
  status: AgentStatus;
  permissionProfileId: string;
  systemsRead: string[];
  systemsWrite: string[];
  schedules: string[];
  lastRunAt: ISODateTime | null;
  currentTask: string | null;
  openFindingsCount: number;
  recentAccuracyNote?: string;
}

export interface AgentRun {
  id: string;
  agentId: AgentId;
  trigger: string;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  status: "running" | "completed" | "failed";
  inputRefs: string[];
  outputSummary: string;
  error: string | null;
}

/** integration id, e.g. "jobber" | "qbo" | "google_calendar" | "ringcentral" | ... */
export type IntegrationId =
  | "jobber"
  | "qbo"
  | "google_calendar"
  | "ringcentral"
  | "companycam"
  | "email"
  | "website_forms"
  | "facebook_leads"
  | "google_reviews"
  | "knowledge_base";

export interface SourceRecord {
  id: string;
  integration: IntegrationId;
  externalId: string;
  entityType: string;
  canonicalRef: string;
  syncedAt: ISODateTime;
  sourceUrl: string | null;
}

export interface Finding {
  id: string;
  agentId: AgentId;
  findingType: string;
  severity: PriorityLevel;
  title: string;
  summary: string;
  entityRefs: string[];
  evidenceRefs: string[];
  confidence: ConfidenceLevel;
  detectedAt: ISODateTime;
  status: "open" | "acknowledged" | "resolved";
}

export interface RecommendationImpact {
  type: ImpactType;
  label: string;
  value?: string;
}

export interface Recommendation {
  id: string;
  cohenRank: number | null;
  priority: PriorityLevel;
  category: RecommendationCategory;
  title: string;
  summary: string;
  whyItMatters: string;
  impact?: RecommendationImpact;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  sourceRefs: string[];
  decisionRequired: string;
  dueAt: ISODateTime | null;
  status: RecommendationStatus;
  findingIds: string[];
  linkedEntity?: { type: "job" | "lead" | "accounting_item" | "customer_case"; id: string };
}

export interface ActionProposal {
  id: string;
  recommendationId: string;
  actionType: string;
  description: string;
  initiatorAgentId: AgentId | "cohen";
  targetRef: string;
  payload: Record<string, unknown>;
  permissionClass: PermissionClass;
  approverRole: UserRole;
  status: ProposalStatus;
  evidenceRefs: string[];
  confidence: ConfidenceLevel;
  urgency: PriorityLevel;
  riskIfDelayed: string;
  impact?: RecommendationImpact;
  editable: boolean;
  createdAt: ISODateTime;
  expiresAt: ISODateTime | null;
  category: RecommendationCategory;
}

export interface ApprovalDecision {
  id: string;
  proposalId: string;
  userId: string;
  decision: "approved" | "rejected" | "clarification_requested" | "edited_and_approved";
  reason: string | null;
  editedPayload: Record<string, unknown> | null;
  decidedAt: ISODateTime;
}

export interface AuditEvent {
  id: string;
  occurredAt: ISODateTime;
  actorType: AuditActorType;
  actorId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  correlationId: string;
  summary: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  priority: PriorityLevel;
  title: string;
  body: string;
  recommendationId: string | null;
  channel: NotificationChannel;
  status: "queued" | "delivered" | "read";
  createdAt: ISODateTime;
  deliveredAt: ISODateTime | null;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "assessment"
  | "quote_in_progress"
  | "quote_sent"
  | "follow_up"
  | "accepted"
  | "deposit_pending"
  | "scheduled"
  | "lost_closed";

export type LeadScore = "hot" | "normal" | "stale" | "at_risk";

export interface Lead {
  id: string;
  source: IntegrationId;
  customerRef: string;
  customerName: string;
  serviceType: string;
  createdAt: ISODateTime;
  respondedAt: ISODateTime | null;
  slaDueAt: ISODateTime;
  stage: LeadStage;
  ownerId: string;
  ownerName: string;
  latestTouch: string;
  nextAction: string;
  score: LeadScore;
  jobberRef: string | null;
  quoteRef: string | null;
  quoteSentAt: ISODateTime | null;
  quoteValue: number | null;
}

export interface Job {
  id: string;
  jobberId: string;
  customerRef: string;
  customerName: string;
  /** e.g. "Ducted heat pump install", "Ductless mini-split, 2 zones" — shown as "Job type" in Today's Operations. */
  serviceType: string;
  community: string;
  scheduledStart: ISODateTime;
  crewRefs: string[];
  stage:
    | "newly_approved"
    | "needs_review"
    | "material_check"
    | "shipment_pending"
    | "ready"
    | "in_progress"
    | "closeout_missing"
    | "complete";
  readinessStatus: JobReadinessStatus;
  readinessScore: number;
  jobberEstimateRef: string;
  openQuestions: string[];
}

export type JobRequirementType =
  | "equipment"
  | "material"
  | "note"
  | "photo"
  | "model_number"
  | "jsa"
  | "closeout";

export interface JobRequirement {
  id: string;
  jobId: string;
  type: JobRequirementType;
  description: string;
  requiredBy: ISODateTime | null;
  status: "missing" | "pending" | "satisfied";
  ownerRef: string;
  evidenceRef: string | null;
}

export interface EquipmentItem {
  id: string;
  jobId: string;
  sourceEstimateLineRef: string;
  manufacturer: string;
  model: string;
  quantity: number;
  status: "pending" | "ordered" | "shipped" | "delivered" | "confirmed" | "unconfirmed";
  supplier: string;
  trackingRef: string | null;
}

export type SafetyRequirementType = "daily_jsa" | "ladder_inspection";

export interface SafetyRequirement {
  id: string;
  jobId: string | null;
  type: SafetyRequirementType;
  assigneeRef: string;
  assigneeName: string;
  dueAt: ISODateTime;
  status: "missing" | "reminded" | "escalated" | "submitted";
  evidenceRef: string | null;
  escalatedAt: ISODateTime | null;
}

export type AccountingItemType = "vendor_bill" | "customer_invoice" | "deposit" | "statement";

export interface AccountingItem {
  id: string;
  type: AccountingItemType;
  vendorOrCustomerRef: string;
  vendorOrCustomerName: string;
  sourceRef: string;
  amount: number;
  dueAt: ISODateTime | null;
  status: "captured" | "prepared" | "awaiting_review" | "reconciled" | "overdue" | "expected" | "received" | "unmatched";
  qboRef: string | null;
  duplicateRisk: boolean;
}

export type CustomerCaseCategory =
  | "warranty"
  | "service_repair"
  | "existing_install_issue"
  | "general_question"
  | "escalated_complaint";

export interface CustomerCase {
  id: string;
  customerRef: string;
  customerName: string;
  jobRef: string | null;
  category: CustomerCaseCategory;
  severity: PriorityLevel;
  status: "new" | "in_progress" | "awaiting_customer" | "needs_technician_review" | "resolved";
  summary: string;
  nextActionAt: ISODateTime | null;
  ownerRef: string;
}

export interface VoiceCall {
  id: string;
  providerCallId: string;
  direction: "inbound" | "outbound";
  contactRef: string;
  contactName: string;
  startedAt: ISODateTime;
  outcome: "jobber_request_created" | "transferred" | "voicemail" | "no_action" | "review_needed";
  urgency: PriorityLevel;
  consentRef: string | null;
  jobberRequestRef: string | null;
  transcriptRef: string | null;
}

export type KnowledgeItemType = "note" | "extracted_rule" | "proposed_sop" | "approved_sop" | "superseded_sop";

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  title: string;
  content: string;
  sourceRefs: string[];
  status: "draft" | "pending_review" | "approved" | "superseded";
  version: number;
  approvedBy: string | null;
  approvedAt: ISODateTime | null;
}

export interface IntegrationSettings {
  id: IntegrationId;
  label: string;
  tier: 1 | 2 | "supporting";
  connected: boolean;
  readCapabilities: string[];
  writeCapabilities: string[];
  permissionScope: string;
  lastSyncAt: ISODateTime | null;
  health: "ok" | "degraded" | "error" | "not_configured";
  healthMessage: string;
}
