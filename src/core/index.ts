// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * The sanctioned AgentOS Core service boundary.
 *
 * This file changes no behavior — every function it re-exports already
 * exists in `src/repositories/*`. What it adds is a single, explicit,
 * lint-checkable seam: `src/app/api/**\/route.ts` handlers (the Dashboard's
 * only sanctioned entry point into Core, per PRODUCTION_ARCHITECTURE.md
 * §2) should import from `@/core`, not reach into `@/repositories/*`
 * directly. Nothing enforces that yet (see PRODUCTION_READINESS_CHECKLIST.md
 * "add an import-boundary lint rule") — this file is the target surface
 * that rule would check against once written, and the concrete list a
 * human developer uses when doing the Option A repository split
 * (PRODUCTION_ARCHITECTURE.md §2) to know exactly what Core exposes.
 *
 * Deliberately NOT re-exported here (Core-internal, never called directly
 * by a route handler): src/cohen/**, src/approvals/engine.ts's internal
 * helpers, src/events/dispatcher.ts, src/data/**, src/integrations/**.
 * Route handlers call the repository functions below; those repository
 * functions are what call into Cohen/the approval engine/the event
 * bus/the adapter roster internally.
 *
 * Phase 3A addition: the import-boundary ESLint rule (`.eslintrc.json`
 * `overrides`) now mechanically enforces that `src/app/**` and
 * `src/components/**` may only reach Core through this file — so every
 * config/policy/type module those layers actually render (division and
 * agent-registry rosters, workflow definitions, governance labels,
 * prohibited-action list, approval-stage derivation) is re-exported below
 * too. None of this changes behavior; it makes the existing dependency
 * explicit and lint-checkable instead of an unenforced convention.
 */

export * from "@/repositories";
export { getCurrentTenant, getModuleEntitlements, isModuleActive, getTenantMembership, hasAtLeastTenantMembership } from "@/lib/tenant-context";
export { getCurrentUser, getUserById, hasAtLeastRole } from "@/lib/auth";
export { canUserApprove } from "@/approvals/engine";
export { recordEvent } from "@/audit/log";
export * from "@/approvals/prohibited";
export * from "@/approvals/stages";
export * from "@/config/agent-registry";
export * from "@/config/divisions";
export * from "@/config/workflows";
export * from "@/domain/governance";
