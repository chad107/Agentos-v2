// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Authentication/RBAC stub. Source: 09_IMPLEMENTATION_PLAN.md Phase 0
 * ("Basic RBAC and audit framework") and Phase 7 ("SSO/auth provider" is
 * explicitly future work, not v1).
 *
 * v1 ships a single signed-in demo session so every screen and API call has
 * a `User` to attribute actions/audit events to, without building a real
 * auth flow. Swapping this for a real session lookup should not require
 * touching callers — they only see `getCurrentUser(): User`.
 */

import type { User, UserRole } from "@/domain";
import { getStore } from "@/data/store";

const DEMO_USER_ID = "u_owner";

export function getCurrentUser(): User {
  const user = getStore().users.find((u) => u.id === DEMO_USER_ID);
  if (!user) {
    throw new Error("Demo user not seeded — check src/data/seed.ts.");
  }
  return user;
}

export function getUserById(id: string): User | undefined {
  return getStore().users.find((u) => u.id === id);
}

const ROLE_RANK: Record<UserRole, number> = {
  read_only: 0,
  staff: 1,
  install_manager: 2,
  administrator: 3,
  operator: 3,
  owner: 4
};

/** Simple role-gate helper for role-gated endpoints (08_API_AND_EVENT_SPEC.md, `/api/agents/:id/run`). */
export function hasAtLeastRole(user: User, minimum: UserRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}
