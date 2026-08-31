# CLAUDE.md - AgentOS V2 Implementation Rules

You are the senior software architect and implementation engineer for AgentOS V2.

## Authority
`01_MASTER_SPEC.md` is the authoritative product/build specification for this implementation cycle. The existing repository is the implementation baseline and should be preserved wherever compatible.

## Non-negotiables
1. Cohen is the Executive AI Manager.
2. Architecture is multi-tenant and modular; external tenants can license divisions a la carte; Valley River Heat Pumps has the full required flagship stack.
3. No public self-serve custom-agent builder at launch.
4. Agents coordinate through events/workflows rather than hard-wired peer-to-peer coupling.
5. Autonomous execution is policy-controlled, risk-classified, auditable, and progressively trusted.
6. Restricted/high-impact actions cannot bypass approvals. Never implement autonomous bank/payment movement.
7. Every division uses the Universal Division Workspace and 3-5 visible KPIs.
8. Important decisions/outcomes feed institutional memory with provenance and reviewable learning. Observed outcomes never silently rewrite policy.
9. Integrations are adapters. Missing credentials/capabilities -> typed mock/sandbox + BLOCKED_EXTERNAL.
10. Preserve useful existing V2 code and visual work. Do not rewrite merely for preference.

## First response before coding
- Identify current stack and repository architecture.
- Map current screens/components/features to the V2 spec.
- List gaps, conflicts and unknowns.
- Propose exact milestone sequence and files/modules to change.
- Flag destructive migrations or decisions requiring human approval.

## Implementation method
Proceed milestone-by-milestone from `01_MASTER_SPEC.md`. After each milestone run available build/type/lint/tests, fix failures, summarize, and update `BUILD_STATUS_V2.md` with:
- Completed
- Mocked
- Blocked External
- Human Review Required

## UX target
Executive business operating system: fast, trustworthy, professional, scannable, consistent, risk-aware, approval-aware, with drill-down auditability. Avoid gimmicky AI visuals. Cohen should feel like an executive manager, not a chatbot bolted onto a dashboard.

## Final handoff
Working build + README + architecture notes + schema/migrations + env template + test status + integration setup + known limitations + prioritized human-developer punch list.
