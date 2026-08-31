# Paste this into Claude Code

You are taking over the current AgentOS source repository and evolving it into AgentOS V2.

Read, in order:
1. `00_READ_ME_FIRST.md`
2. `01_MASTER_SPEC.md`
3. `CLAUDE.md`
4. `03_GAP_ANALYSIS.md`
5. `BUILD_STATUS.md`
6. the actual repository source/tests/config

The existing code is the implementation baseline. The V2 Master Spec is the authoritative target. Preserve working code and UX where compatible. Do not restart from scratch.

Before changing code, return a repository audit that:
- identifies current stack, routes, architecture and data flow;
- maps current features to the V2 spec;
- verifies or corrects `03_GAP_ANALYSIS.md`;
- lists gaps, conflicts, unknowns and production blockers;
- proposes the exact milestone/file-change sequence;
- flags any destructive migration or architecture decision needing human approval;
- reports whether install/build/typecheck/lint/tests currently pass.

Then proceed milestone-by-milestone unless genuinely blocked. Maintain `BUILD_STATUS_V2.md` with Completed / Mocked / Blocked External / Human Review Required.

Critical rules:
- Cohen is Executive AI Manager.
- Multi-tenant isolation is mandatory.
- All eight divisions must be configuration-driven through one Universal Division Workspace.
- Progressive trust must be policy-controlled and auditable.
- Never implement autonomous bank/payment movement.
- External integrations remain adapters; unknown capabilities become mocks marked BLOCKED_EXTERNAL.
- Preserve existing useful code and visual work; do not rewrite for preference.
- Important decisions/outcomes feed reviewable institutional memory; outcomes do not silently rewrite policy.
- Marketing must include market intelligence, creative, advertising, reputation, SEO, analytics and Brand Guardian, with Canva draft support and approval-controlled publishing.

Build as much production-capable code as can be safely implemented. Human developers will connect credentials/APIs, make infrastructure decisions, resolve vendor edge cases and finesse production deployment afterward.
