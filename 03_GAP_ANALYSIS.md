# AgentOS V2 - Baseline-to-Master-Spec Gap Analysis

## Current implementation baseline
The uploaded repository is a substantial Next.js 14 + React 18 + TypeScript + Tailwind prototype with an in-memory seeded data store. It already contains an approval engine, prohibited-action guardrails, append-only style audit utilities, Cohen orchestration, mocked integration adapters, multiple product screens, and a Vitest suite.

## Preserve / evolve rather than rewrite
Strong reusable V2 foundations already present:
- App shell, sidebar/mobile navigation, TopBar.
- Home/command-centre widgets including Health Strip, Needs Attention, Nothing Left Behind, Today's Operations, Agent Tiles, Activity and deadlines.
- Cohen command UI (`AskCohenPanel`) and orchestrator/model-provider abstraction.
- Recommendation cards + evidence drawer.
- Approval Center, ProposalCard, StageTracker, approve/reject/clarify routes.
- Prohibited-action guardrails and approval engine.
- Sales pipeline/lead/SLA logic and competitor signals.
- Operations readiness/job detail logic.
- Safety/JSA cadence.
- Accounting read-model screens and payment restrictions.
- Customer, Voice, Knowledge, Activity and Integration/Permission settings pages.
- Repository/domain/integration layering.
- Mock adapter concept.
- Existing unit tests and self-verification scripts.

## Primary V2 gaps

### A. True multi-tenant architecture - HIGH
Current code is essentially a flagship/demo tenant with lightweight auth stubs and an in-memory store. V2 requires explicit Tenant/User/Role/Permission semantics and `tenant_id` enforcement in every business data path plus tenant-isolation tests.

### B. Division architecture + Universal Division Workspace - HIGH
Current code exposes separate functional pages rather than the required configuration-driven Division model and one reusable Universal Division Workspace. V2 requires all eight divisions: Sales, Marketing, Operations, Finance, Safety, Customer Experience, Administration, Executive Intelligence.

### C. Marketing Division - HIGH
Current repo has sales competitor signals but does not yet implement the full Marketing Manager hierarchy, Content & Creative, Advertising, Reputation, SEO, Campaign Analytics, Brand Guardian, campaign factory, Canva draft workflow, or Meta/Google publishing adapter policy.

### D. Administration + Executive Intelligence - HIGH
Neither division currently exists as first-class module/workspace with its manager/specialists/KPIs.

### E. Module entitlements/licensing - HIGH
No complete data-driven ModuleEntitlement framework yet. Valley River must be seeded as flagship/full stack while future tenants can have active/inactive/trial/suspended modules and tier/configuration.

### F. Progressive trust - HIGH
Current system is deliberately approval-first. V2 must preserve that safe baseline while adding per-agent/workflow risk tiers, shadow/supervised/guarded/trusted states, metrics, promotion criteria, demotion, and policy-controlled auto-execution.

### G. Event/workflow engine - HIGH
Cohen orchestration exists, but V2 requires a formal event envelope, workflow registry/versions, correlation IDs, idempotency, task generation, retries/error visibility, and event-driven cross-division routing.

### H. Four-layer memory + decision/outcome learning - HIGH
Current Knowledge page is a useful seed but V2 requires explicit global/company/division/executive scope, classification/provenance/confidence/effective dates/supersession, stale/conflict visibility, decisions, expected vs actual outcomes, lessons, and reviewable learning updates.

### I. Agent Registry V2 contract + versioning - MEDIUM/HIGH
Current Agent Centre should evolve to the full Standard Agent Contract, AgentVersion, autonomy/trust, permissions, subscribed/emitted events, schema contracts, KPI mappings, knowledge scopes, version history, and richer run telemetry.

### J. Work Queue / Notification Center unification - MEDIUM/HIGH
Existing approvals/needs-attention/tracked/deadline concepts should converge into the V2 unified Task/Notification/Approval model with cross-division filters, ownership, escalation, comments/context and deep links.

### K. API surface / domain model expansion - HIGH
Existing API routes cover a useful subset. Add `/api/tenants`, `/api/divisions`, `/api/workflows`, `/api/events`, `/api/tasks`, `/api/notifications`, `/api/kpis`, `/api/decisions`, `/api/audit`, `/api/modules`, `/api/cohen/brief`, `/api/cohen/recommendations`, `/api/cohen/command`, plus agent versions.

### L. Integration contract expansion - MEDIUM/HIGH
Existing mock adapters are a strong foundation. Expand to explicit capabilities/health/status for Jobber, QBO, CompanyCam, Sortly, RingCentral, Google Calendar, Drive/Gmail, Canva, Meta/Google Ads. Real connections remain BLOCKED_EXTERNAL until credentials/scopes are approved.

### M. Persistent production data/auth - HUMAN-DEV / ARCHITECTURE DECISION
The current in-memory store and auth stub are acceptable for prototype/demo but not production. Select database, migrations, auth provider/session strategy, secret manager, deployment environment, backup/retention and observability before production launch.

### N. Accessibility/loading/error/degraded states - MEDIUM
Existing UI should be audited systematically against V2 responsive/accessibility and explicit loading/empty/error/success/degraded-integration requirements.

## Recommended migration sequence
0. Verify repository + install/build/typecheck/test.
1. Introduce V2 tenant/division/module/agent/version/task/KPI/event types without breaking existing screens.
2. Add tenant context and flagship seed; wrap repository access with tenant enforcement.
3. Create Universal Division Workspace and division configuration registry; map existing Sales/Operations/Safety/Finance/CX into it, then add Marketing/Admin/Executive Intelligence.
4. Upgrade Cohen executive dashboard to aggregate division KPIs, risks, opportunities, approvals and work queue.
5. Expand Agent Registry/Agent pages to V2 contract + version/trust model.
6. Unify Task/Notification/Approval models.
7. Implement policy/risk/progressive-trust framework while keeping existing approval-first behavior as default.
8. Implement four-layer memory + decision/outcome model.
9. Implement event/workflow engine and migrate current hard-coded triggers into registered workflows.
10. Expand integration adapters/health models; implement Marketing/Canva/ads mocks.
11. Encode/verify all Valley River flagship workflow rules.
12. QA, tenant-isolation/security review, human-developer integration/persistence/deployment handoff.

## Avoid these mistakes
- Do not delete the current working dashboard to make a new architecture prettier.
- Do not turn mock integrations into fabricated live integrations.
- Do not make approval-first V1 behavior disappear while progressive trust is introduced.
- Do not hard-code Valley River branding/business rules into reusable platform components; keep them in tenant configuration.
- Do not create eight duplicated division pages; use one configuration-driven workspace.
- Do not let retrieved knowledge or model output grant permissions.
