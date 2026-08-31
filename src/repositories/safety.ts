// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { SafetyRequirement } from "@/domain";
import { getStore } from "@/data/store";

export function listSafetyRequirements(): SafetyRequirement[] {
  return getStore().safetyRequirements;
}

export function missingOrEscalatedJsa(): SafetyRequirement[] {
  return listSafetyRequirements().filter(
    (r) => r.type === "daily_jsa" && (r.status === "missing" || r.status === "reminded" || r.status === "escalated")
  );
}

export function ladderInspections(): SafetyRequirement[] {
  return listSafetyRequirements().filter((r) => r.type === "ladder_inspection");
}

export function safetyEvidenceMissingCount(): number {
  return listSafetyRequirements().filter((r) => r.status === "missing" || r.status === "escalated").length;
}
