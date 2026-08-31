# AgentOS V2 - Master Architecture & Claude Build Specification

Flagship implementation: Valley River Heat Pumps.

## Mission
Build a modular, multi-tenant AI business operating system. Valley River Heat Pumps is the flagship full-stack implementation. External customers can license a core platform plus optional AI divisions/modules.

## Build instruction
Treat this repository and this specification as one coordinated build package. Do not silently simplify or remove requirements. Build incrementally, preserve functioning existing code where compatible, and document assumptions, mocks, blocked integrations, and human-review items.

Before coding:
1. Inspect framework, routes, components, state management, persistence, authentication, API patterns, and deployment configuration.
2. Produce a gap analysis against this V2 spec.
3. Preserve functioning code unless replacement is required.
4. Create a branch/commit plan by milestone.
5. Use mock/sandbox adapters where credentials or confirmed API capabilities are unavailable. Never hard-code secrets.

During coding:
- Use strict TypeScript where supported.
- Prefer reusable primitives and configuration-driven divisions/agents.
- Enforce tenant isolation in every data access path.
- Every autonomous/material action must pass policy/permission checks and create an audit event.
- Make UI responsive and accessible.
- Test critical workflows, permissions, approvals, progressive trust, auditability, and tenant isolation.

Definition of done for each milestone:
- Code builds without errors.
- Type/lint checks pass.
- Relevant tests pass.
- UI includes loading, empty, error, and success states.
- Auditability is preserved.
- Build status identifies Completed / Mocked / Blocked External / Human Review Required.

## Locked V2 product principles
- Cohen is the Executive AI Manager.
- Target operating model: auto-execute within explicit guardrails.
- Progressive trust expands autonomy only after demonstrated reliability.
- Important decisions and outcomes become institutional memory by default.
- Four memory layers: global platform, company, division, executive/personal preferences.
- Knowledge is classified by provenance/confidence: policy, verified fact, assumption, hypothesis/experiment, decision, lesson.
- External commercialization is modular/a-la-carte; Valley River receives the full required flagship stack.
- No public self-serve custom-agent builder at launch. Custom work is curated/service-led; proven work may become certified packs/modules.
- Each division exposes 3-5 primary KPIs instead of one opaque health score.
- Every division uses one Universal Division Workspace pattern.

## Product architecture
Hierarchy:
1. Tenant / Company
2. Cohen - Executive AI Manager
3. Divisions
4. Division Manager Agents
5. Specialist Agents
6. Tools / integration adapters
7. Event bus + workflow orchestrator
8. Policy / approval engine
9. Memory / knowledge service
10. Audit + observability service

Core platform capabilities:
- Authentication + RBAC
- Tenant/company settings and theming
- Cohen executive dashboard and command interface
- Work Queue
- Notifications & Approval Center
- Agent Registry
- Workflow/task orchestration
- Integration Registry
- Knowledge/memory
- Decision/outcome memory
- Audit trail
- KPI/analytics framework
- Licensing/module entitlements
- Progressive trust/autonomy framework

## Modular licensing
External customers receive core platform plus licensed divisions. Entitlements must be data-driven, not hard-coded.
Suggested entitlement object:
- tenant_id
- module_key
- status: active | inactive | trial | suspended
- tier: starter | pro | enterprise | flagship
- activated_at
- expires_at nullable
- configuration JSON

Valley River: all required divisions enabled.

## Event-driven orchestration
Agents should not be tightly coupled peer-to-peer. Business events are published; policy determines eligible workflows; the orchestrator routes work to the correct manager/specialist agent.

Canonical event examples:
- lead.created
- quote.created
- quote.accepted
- deposit.received
- job.scheduled
- job.readiness_due
- shipment.updated
- job.completed
- closeout.missing
- invoice.received
- bill.due_soon
- payment.received
- jsa.due
- jsa.missing
- review.received
- competitor.promotion_detected
- campaign.draft_ready
- approval.requested
- approval.resolved
- risk.detected

Primary cross-division lifecycle: Marketing -> Sales -> Operations -> Customer Experience. Finance and Safety/Compliance span the lifecycle. Administration supports all divisions. Executive Intelligence and Cohen synthesize the company view.

# Divisions and agents

## Sales Division
Manager: Sales Manager Agent.
Specialists: Lead Intake, Communications, Estimating, Follow-up, CRM Intelligence, Sales Analytics.
KPIs: lead response time, quote turnaround, quote conversion, pipeline value, forecast accuracy.
Valley River rules: business-day lead response <=60 minutes; quotes normally <=24 hours and max 48 hours; Jobber auto follow-up after 2 days; manual follow-up around day 3-4; accepted quote and typical 50% deposit drive downstream readiness.

## Marketing Division
Manager: Marketing Manager Agent.
Specialists:
- Market Intelligence Agent
- Content & Creative Agent
- Advertising Agent
- Reputation Agent
- Website & SEO Agent
- Campaign Analytics Agent
- Brand Guardian Agent
KPIs: qualified leads, cost per lead, lead-to-sale conversion, campaign ROI, reputation/review health.
Required workflow: competitor/incentive research -> identify opportunity -> promotion concept -> campaign package + creative draft -> Brand Guardian -> approval -> publish only inside granted permissions -> measure outcome.
Canva is a draft/creative adapter, not a bypass around approval policy.

## Operations Division
Manager: Operations Manager Agent.
Specialists: Scheduling & Dispatch, Materials & Inventory, Procurement & Shipping, Job Readiness, Crew Coordination, Quality, Fleet & Equipment, Closeout, Capacity Planning.
KPIs: on-time completion, crew utilization/capacity, first-time quality, schedule adherence, job profitability.
Valley River: readiness triggered by accepted estimate/deposit; verify equipment/materials at least 3 business days before job; equipment list may originate from Jobber quote plus standard materials; Gree Canada shipments may be tracked via Midland Transport using tracking from Gree invoice; crews selected in Jobber; 4:00 PM CompanyCam model/photo closeout check; missing proof escalates.

## Accounting & Finance Division
Manager: Finance Manager Agent.
Specialists: Accounts Receivable, Accounts Payable, Payroll Intelligence, Job Costing, Financial Compliance, Purchasing Intelligence, Business Advisor, Financial Risk.
KPIs: cash flow, gross margin, A/R aging, net profit, budget vs actual.
Guardrail: agents do not autonomously access bank accounts or make payments. Authorized email may be used to identify vendor invoices and create/draft QBO bills within permitted scope, with due-soon reminders ~3 business days prior and statement cross-checking.

## Safety & Compliance Division
Manager: Safety & Compliance Manager Agent.
Specialists: JSA Management, Training & Certification, Fleet/Ladder Inspection, Incident Management, Regulatory Compliance, Risk Assessment, Safety Analytics / Predictive Safety.
KPIs: JSA completion, training compliance, inspection compliance, incident rate, corrective-action closure.
Valley River JSA: daily request Monday-Friday; primary Al, designee Aiden Brennan; photo evidence; 4:00 PM reminder; 4:30 PM escalation to Cohen; store evidence; daily roll-up; monthly ladder inspection reminder.

## Customer Experience Division
Manager: Customer Experience Manager Agent.
Specialists: Customer Success, Warranty & Service, Reviews & Referrals, Customer Communications, Retention & Renewals, Voice of Customer, Customer Journey Intelligence.
KPIs: customer satisfaction, review score, referral rate, warranty response time, retention/renewal rate.

## Administration Division
Manager: Administration Manager Agent.
Specialists: Executive Assistant, Communications, Document Management, Knowledge Management, Workflow Automation, Meeting Intelligence, Policy & Governance, Implementation Manager.
KPIs: time saved, automation rate, document compliance, knowledge freshness, action-item completion.

## Executive Intelligence Division
Manager: Cohen / Executive Intelligence Manager capability.
Capabilities: Daily Executive Briefing, Business Intelligence, Strategic Planning, Forecasting, Opportunity Detection, Risk Intelligence, Executive Advisor, Decision Memory.
Outputs: cross-division briefs, forecasts, opportunities, risks, recommended decisions, rationale, decision/outcome tracking.

# Standard Agent Contract
Every agent registry record should include:
- id, tenant_id, division_id
- name, role, version, status
- mission/purpose
- manager_agent_id
- capabilities[]
- subscribed_events[] / emitted_events[]
- allowed_tools[]
- required_permissions[]
- approval_policy_id
- autonomy_level
- risk_classification
- input_schema / output_schema
- KPI mappings
- knowledge scopes
- escalation targets
- accountable human role
- last_updated_at

Every execution records:
- execution_id
- agent_id/version
- trigger/event
- input references
- retrieved knowledge references
- proposed actions
- confidence score
- risk score
- policy decision
- approval requirement/result
- tools/adapters invoked
- result
- errors/retries
- human edits/overrides
- outcome measurement
- timestamps

Agent Registry UI: searchable/filterable by division/status/manager/version/autonomy; expose capabilities, tools, permissions, KPIs, success/error rate, recent changes, execution history, audit, knowledge scope, version history.

# Governance, approvals, progressive trust
Target state: auto-execute inside explicit guardrails; start conservatively.
Risk tiers:
- Tier 0 Informational: read/analyze/summarize. Auto.
- Tier 1 Low-risk reversible: draft/classify/internal metadata/reminders. Auto after trust; otherwise shadow/approval.
- Tier 2 Moderate external/reversible: routine communications, permitted non-financial records/scheduling. Policy-dependent approval.
- Tier 3 High-impact: strategic pricing, contractual/customer commitments, consequential publishing, sensitive HR/compliance. Human approval unless explicit future policy changes it.
- Tier 4 Restricted: money movement/bank payments, destructive irreversible actions, actions outside legal/credential scope. Blocked by default.

Trust states per agent/workflow: shadow, supervised, guarded auto, trusted auto. Promotions require minimum sample size, success rate, low override/error rate, and no unresolved critical incidents. Material failures/policy violations can demote automatically.

Approval card requirements: title, recommended action, reason, confidence, risk, affected record, evidence/source links, what approval will do, approve/reject/ask/edit, expiration/deadline.
Valley River priority: Safety > Financial > Customer impact. Urgent items interrupt; lower-risk items can bundle. 4:30 PM executive recap supported.

# Memory and knowledge
Four layers:
1. Global platform knowledge
2. Company knowledge
3. Division knowledge
4. Executive/personal preference layer

Knowledge object fields: id, tenant_id, scope_type, scope_id, title/content/document reference, source/provenance, classification, confidence, effective_from, expires_at, owner, approved_by, tags, supersedes_id, timestamps.

Institutional memory: important decisions store context, alternatives, rationale, approver, expected outcome, actual outcome, lessons. Observed outcomes never silently rewrite policy; learning becomes a reviewable proposed knowledge update.

Retrieval rules: enforce tenant/scope isolation; prefer current approved policy; surface conflict/staleness; include provenance in execution/audit views.

# UX specification
Navigation:
- Executive / Cohen
- Divisions
- Work Queue
- Notifications & Approvals
- Agents
- Knowledge
- Analytics
- Integrations
- Settings / Licensing / Governance

Cohen Executive Dashboard above the fold:
- greeting/company + Cohen status
- urgent alerts/approvals
- company KPI snapshot
- division health cards using 3-5 KPI indicators
- active risks/opportunities
- Cohen recommendations + command interface
Secondary:
- cross-division work queue
- forecasts/trends
- recent autonomous actions
- decisions awaiting outcome measurement
- daily briefing / recap

Universal Division Workspace - same structure across every division:
1. Executive Summary
2. 3-5 KPI cards
3. Alerts & Exceptions
4. Active Work Queue
5. Forecasting / Trends
6. AI Recommendations
7. Audit & Learning
Also expose Division Manager and specialist roster.

Individual Agent Page: identity/status/version, mission/manager, autonomy/trust, capabilities/tools/permissions, KPIs, current tasks, recent executions, audit, knowledge scope, version history.

Work Queue: unified task model with division/agent/owner/priority/status/due/customer-job/risk/approval filters; assignment, escalation, comments/context, deep links.

Notification Center: title, action, reason, confidence, priority, source/context, timestamp; approve/reject/ask/edit/open; grouped and urgent modes.

Visual target: professional SaaS operating-system feel; scannable, consistent, responsive, accessible, dense but not cluttered. Avoid gimmicky AI visuals. Cohen should feel like an executive manager, not a chatbot added to a dashboard. Platform components must be tenant-themeable, not Valley-River-hard-coded.

# Data model and API contracts
Core entities: Tenant, User, Role, Permission, Division, ModuleEntitlement, Agent, AgentVersion, Capability, ToolIntegration, Workflow, WorkflowVersion, Event, Task, AgentExecution, Approval, Policy, Notification, KPI, KPIObservation, KnowledgeObject, Decision, Outcome, AuditEvent, CustomerRef, JobRef, CampaignRef, DocumentRef.
All business entities carry tenant_id where applicable. Prefer immutable IDs/timestamps and append-only audit events.

Suggested API:
/api/tenants
/api/divisions
/api/agents
/api/agents/:id/versions
/api/workflows
/api/events
/api/tasks
/api/approvals
/api/notifications
/api/kpis
/api/knowledge
/api/decisions
/api/audit
/api/integrations
/api/modules
/api/cohen/brief
/api/cohen/recommendations
/api/cohen/command

Event envelope example:
```json
{
  "id": "evt_...",
  "tenantId": "tenant_...",
  "type": "quote.accepted",
  "occurredAt": "ISO-8601",
  "source": "jobber",
  "subject": {"type":"quote","id":"..."},
  "correlationId": "...",
  "payload": {},
  "schemaVersion": 1
}
```

Approval envelope includes tenant, action type, proposed payload, human-readable summary, rationale, confidence, risk, requestedByAgent, policy evaluation, status, approver, resolution, timestamps, linked audit events.

# Integration rule
External systems stay behind adapters. Domain logic must not depend directly on vendor SDKs. When credentials or confirmed capabilities are unavailable, implement typed mock/sandbox adapters and mark BLOCKED_EXTERNAL rather than invent vendor behavior.

Valley River adapter targets:
- Jobber
- QuickBooks Online
- CompanyCam
- Sortly
- RingCentral
- Google Calendar
- Google Drive
- Gmail / authorized email
- Canva
- Meta / Google advertising

Integration status: disconnected | connected | degraded | error | mocked. Show last sync, scopes, health, recent errors.

# Canonical workflows
Lead-to-job: lead.created -> Sales intake -> classify/assign -> SLA -> estimate/quote -> follow-up -> quote.accepted -> deposit check -> operations readiness.

Job readiness: quote.accepted/deposit.received -> extract equipment/materials -> add standard materials -> inventory/data confidence -> procurement/shipping tasks -> verify >=3 business days before job -> exception to Operations Manager/Cohen.

Closeout: job.completed -> 4 PM verify CompanyCam photos/model numbers -> complete -> invoicing path; missing -> exception/escalation.

JSA: workday/job trigger -> request evidence -> verify -> 4 PM reminder -> 4:30 PM Cohen escalation -> store -> daily roll-up -> monthly ladder inspection reminder.

Vendor/AP: invoice in authorized email -> extract vendor/date/amount/due -> duplicate/confidence checks -> draft/create QBO bill within permission -> 3-business-day reminder -> statement cross-check -> never initiate bank payment.

Marketing campaign factory: market scan -> competitor/incentive intelligence -> opportunity score -> campaign concept -> offer/claims check -> content + creative draft -> Brand Guardian -> Marketing Manager -> Approval Center -> approved publishing workflow -> measurement -> outcome/learning.

Executive loop: Monitor -> Analyze -> Recommend -> policy evaluation -> Execute or request approval -> Observe -> Measure -> decision/outcome record -> proposed learning.

# Security and non-functional requirements
- Mandatory multi-tenant isolation.
- RBAC + policy-based action authorization.
- Secrets only in secure env/secret manager; never repo/client/logs.
- Encryption in transit/at rest using platform-standard mechanisms.
- Audit every material agent/human action.
- Idempotency for webhook/event processing.
- Bounded retries + dead-letter/error visibility.
- Rate-limit public/expensive endpoints.
- Validate tool I/O against schemas.
- Defend against prompt/tool injection; retrieved content never grants permissions.
- Tenant retention/deletion hooks.
- WCAG 2.1 AA where practical.
- Responsive UI and graceful degraded integrations.
- Structured logs, traces/correlation IDs, error monitoring, integration health.

# Claude Build Manifest
Milestone 0 - Repository audit: architecture map, gap analysis, risk list, preserved components, migration plan, proposed file tree. No destructive rewrite.
Milestone 1 - Platform shell/design system: navigation, responsive shell, tenant context, reusable UI primitives, all states, route structure.
Milestone 2 - Core domain/mock data: tenants, divisions, agents, tasks, approvals, notifications, KPIs, audit, entitlements; Valley River flagship seed.
Milestone 3 - Cohen executive dashboard: division cards, risks/opportunities, recommendations, approval summary, recent actions, daily brief, command shell.
Milestone 4 - Universal division workspace: configuration-driven page; instantiate Sales, Marketing, Operations, Finance, Safety, CX, Administration, Executive Intelligence.
Milestone 5 - Agent Registry/pages: filters, version/autonomy/status, detail, execution history, permissions, KPIs.
Milestone 6 - Work Queue + Notification/Approval Center: task lifecycle, priority, assignment, approvals, questions/edits, escalation, audit linkage.
Milestone 7 - Governance/progressive trust: risk tiers, policy evaluation, trust states, promotion/demotion model/UI.
Milestone 8 - Memory/knowledge/decision memory: scoped model/UI, provenance, staleness/conflicts, decisions/outcomes.
Milestone 9 - Workflow/event engine: event envelope, workflow registry, task creation, correlation IDs, idempotency, sample workflows.
Milestone 10 - Integration adapter layer: Jobber, QBO, CompanyCam, Sortly, RingCentral, Calendar, Drive/Gmail, Canva, Meta/Google Ads; real only with credentials/scopes.
Milestone 11 - Valley River workflow configuration: lead SLA, quote timing, 50% deposit, readiness timing, JSA cadence, 4 PM closeout, AP reminders, priority, full flagship entitlements.
Milestone 12 - QA/human developer handoff: tests, tenant-isolation/security review, integration gaps, technical debt, manual setup, env template, deployment, schema/migrations, prioritized punch list.

# Do not fabricate
Unknown API endpoint, credential, webhook capability or vendor permission -> adapter contract + mock + BLOCKED_EXTERNAL.

# Acceptance checklist
- Cohen executive dashboard is useful on its own.
- All 8 divisions are configuration-driven.
- Marketing includes intelligence, creative, advertising, reputation, SEO, analytics, Brand Guardian.
- Operations includes capacity planning + Valley River readiness/closeout.
- Finance includes Business Advisor + Financial Risk and blocks autonomous payment.
- Safety includes JSA + predictive safety capability.
- CX, Administration, Executive Intelligence exist.
- Universal Division Workspace reused, not copied eight times.
- Agent Registry + agent detail pages exist.
- Work Queue + Approval/Notification Center exist.
- 3-5 KPIs visible per division.
- Risk tiers + progressive trust states modeled.
- Material actions traceable in audit history.
- Four-layer knowledge + decision/outcome memory exist.
- Licensing/entitlement model exists; Valley River full stack enabled.
- Tenant isolation tests exist.
- Integration adapters show health/status + mocks.
- No secrets committed.
- Responsive/accessibility basics implemented.
- V2 build status separates Completed / Mocked / Blocked External / Human Review Required.
