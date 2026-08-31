// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Agent Registry V2 contract overlay. Source: 01_MASTER_SPEC.md "Standard
 * Agent Contract". Keyed by the existing v1 `AgentId` (src/domain/entities.ts)
 * rather than folded into the `Agent` interface itself, so v1 seed
 * data/tests that construct `Agent` records are untouched.
 *
 * Risk tiers and trust states below are derived from what each agent
 * actually does in this build (src/data/seed.ts: every agent has
 * `systemsWrite: []` — none has live write capability; every consequential
 * proposal resolves to `approved_simulation`, never autonomous execution —
 * src/approvals/engine.ts). Nothing here is invented telemetry; there are
 * no real execution-history metrics to report yet, so none are claimed.
 */

import type { AgentRegistryEntry } from "@/domain/governance";
import type { AgentId } from "@/domain";

/** Runtime-checkable mirror of the `AgentId` union (src/domain/entities.ts) for validating route params. */
export const AGENT_IDS = [
  "sales",
  "operations",
  "safety",
  "accounting",
  "customer",
  "voice",
  "research",
  "knowledge"
] as const satisfies readonly AgentId[];

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  {
    agentId: "sales",
    divisionKey: "sales",
    version: "1.0.0",
    riskTier: 2,
    trustState: "supervised",
    trustRationale:
      "Drafts customer-facing follow-up/quote messages (Tier 2, routine communications) but has no send capability — every draft is reviewed in the Approval Center before anything reaches a customer.",
    capabilities: ["Lead SLA monitoring", "Quote-aging follow-up drafting", "Pipeline analytics"],
    subscribedEvents: ["lead.created", "quote.created"],
    emittedEvents: ["quote.accepted", "risk.detected"],
    requiredPermissions: ["read:jobber", "read:website_forms", "read:facebook_leads", "read:google_reviews"],
    kpiMappings: ["Lead response time", "Quote turnaround", "Quote conversion", "Pipeline value"],
    knowledgeScopes: ["division:sales", "company"],
    escalationTarget: "Sales Manager Agent",
    accountableHumanRole: "operator"
  },
  {
    agentId: "operations",
    divisionKey: "operations",
    version: "1.0.0",
    riskTier: 1,
    trustState: "supervised",
    trustRationale:
      "Read-only readiness monitoring and internal exception flags (Tier 1, internal metadata) — no scheduling or procurement write capability exists yet.",
    capabilities: ["Job readiness scoring", "Closeout evidence verification"],
    subscribedEvents: ["quote.accepted", "deposit.received", "shipment.updated", "job.completed"],
    emittedEvents: ["job.readiness_due", "closeout.missing"],
    requiredPermissions: ["read:jobber", "read:companycam"],
    kpiMappings: ["Schedule adherence"],
    knowledgeScopes: ["division:operations", "company"],
    escalationTarget: "Operations Manager Agent",
    accountableHumanRole: "install_manager"
  },
  {
    agentId: "safety",
    divisionKey: "safety",
    version: "1.0.0",
    riskTier: 1,
    trustState: "supervised",
    trustRationale:
      "Requests and tracks JSA evidence and sends reminders (Tier 1) with a defined 4:30 PM escalation to Cohen — escalation is visibility, not an autonomous action.",
    capabilities: ["Daily JSA cadence", "Monthly ladder-inspection reminders"],
    subscribedEvents: ["job.scheduled"],
    emittedEvents: ["jsa.due", "jsa.missing"],
    requiredPermissions: ["read:companycam"],
    kpiMappings: ["JSA completion", "Inspection compliance"],
    knowledgeScopes: ["division:safety", "company"],
    escalationTarget: "Cohen",
    accountableHumanRole: "owner"
  },
  {
    agentId: "accounting",
    divisionKey: "finance",
    version: "1.0.0",
    riskTier: 2,
    trustState: "supervised",
    trustRationale:
      "Drafts QBO bill data from authorized-email vendor invoices (Tier 2) — never accesses bank accounts or initiates payment (Tier 4, blocked by design; no code path exists).",
    capabilities: ["Vendor bill drafting", "Due-soon reminders", "Statement cross-checking"],
    subscribedEvents: ["invoice.received"],
    emittedEvents: ["bill.due_soon"],
    requiredPermissions: ["read:email", "read:jobber", "read:qbo"],
    kpiMappings: ["A/R aging (open exceptions)"],
    knowledgeScopes: ["division:finance", "company"],
    escalationTarget: "Finance Manager Agent",
    accountableHumanRole: "owner"
  },
  {
    agentId: "customer",
    divisionKey: "customer_experience",
    version: "1.0.0",
    riskTier: 2,
    trustState: "supervised",
    trustRationale:
      "Triages and routes customer cases (Tier 2, customer-facing records); warranty cases are always routed to human technician review, never diagnosed by the agent (AT-17).",
    capabilities: ["Case triage", "Service handoff drafting"],
    subscribedEvents: ["review.received"],
    emittedEvents: [],
    requiredPermissions: ["read:jobber", "read:email"],
    kpiMappings: [],
    knowledgeScopes: ["division:customer_experience", "company"],
    escalationTarget: "Customer Experience Manager Agent",
    accountableHumanRole: "administrator"
  },
  {
    agentId: "voice",
    divisionKey: "customer_experience",
    version: "1.0.0",
    riskTier: 2,
    trustState: "shadow",
    trustRationale:
      "Paused — business hours, transfer number and booking authority are not yet configured (12_OPEN_ITEMS.md). Shadow until those policy inputs exist; outbound remains consent-gated by design (AT-16).",
    capabilities: ["Inbound call qualification", "Structured Jobber request creation"],
    subscribedEvents: [],
    emittedEvents: ["lead.created"],
    requiredPermissions: ["read:ringcentral", "read:jobber", "read:google_calendar"],
    kpiMappings: [],
    knowledgeScopes: ["division:customer_experience"],
    escalationTarget: "Customer Experience Manager Agent",
    accountableHumanRole: "owner"
  },
  {
    agentId: "research",
    divisionKey: "marketing",
    version: "1.0.0",
    riskTier: 0,
    trustState: "guarded_auto",
    trustRationale:
      "Read-only market/competitor research (Tier 0, informational) — runs automatically; nothing it produces publishes or spends without a separate Marketing Division approval flow (not yet implemented, see BUILD_STATUS_V2.md gap C).",
    capabilities: ["Competitor promotion scanning"],
    subscribedEvents: [],
    emittedEvents: ["competitor.promotion_detected"],
    requiredPermissions: ["read:google_reviews", "read:website_forms"],
    kpiMappings: [],
    knowledgeScopes: ["division:marketing", "global"],
    escalationTarget: "Marketing Manager Agent (division not yet implemented)",
    accountableHumanRole: "owner"
  },
  {
    agentId: "knowledge",
    divisionKey: "administration",
    version: "1.0.0",
    riskTier: 1,
    trustState: "supervised",
    trustRationale:
      "Proposes SOP drafts from captured notes (Tier 1) — every proposed/approved SOP transition goes through the Approval Center, never a silent-approve path.",
    capabilities: ["Note capture", "SOP drafting"],
    subscribedEvents: [],
    emittedEvents: [],
    requiredPermissions: ["read:knowledge_base"],
    kpiMappings: ["Knowledge freshness"],
    knowledgeScopes: ["division:administration", "global"],
    escalationTarget: "Administration Manager Agent (division not yet implemented)",
    accountableHumanRole: "administrator"
  }
];

export function getAgentRegistryEntry(agentId: string): AgentRegistryEntry | undefined {
  return AGENT_REGISTRY.find((a) => a.agentId === agentId);
}
