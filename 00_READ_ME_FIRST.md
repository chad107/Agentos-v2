# AgentOS V2 - Combined Claude Build Package

## What this package is
This repository combines the current working AgentOS source code with the AgentOS V2 Master Architecture & Claude Build Specification.

### Source of truth hierarchy
1. `01_MASTER_SPEC.md` - authoritative V2 product and architecture target.
2. Existing working source code - implementation baseline to preserve wherever compatible.
3. `03_GAP_ANALYSIS.md` - current-code-to-V2 map and migration priorities.
4. `BUILD_STATUS.md` - historical implementation record from the existing codebase; useful evidence, but where it says "v1" or conflicts with the V2 master spec, the V2 master spec governs.

## Prime directive
Do not restart the application from scratch. Audit first, preserve functioning code, and evolve the current Next.js/TypeScript implementation toward V2 milestone by milestone.

## Start sequence for Claude Code
1. Read `00_READ_ME_FIRST.md`.
2. Read `01_MASTER_SPEC.md` completely.
3. Read `CLAUDE.md`.
4. Read `03_GAP_ANALYSIS.md`.
5. Inspect the repository and verify the gap analysis against the actual code.
6. Run install/build/typecheck/lint/tests if the environment permits.
7. Produce a pre-code audit response before making destructive or architecture-changing edits.
8. Implement V2 milestone-by-milestone, updating `BUILD_STATUS_V2.md` after each milestone.

## Non-negotiable preservation rule
Keep useful existing UI, routes, domain logic, approval guardrails, audit logic, seeded workflows, tests, and integration abstractions where compatible. Refactor only when necessary to satisfy the V2 architecture.
