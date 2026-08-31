// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { KnowledgeItem } from "@/domain";
import { getStore } from "@/data/store";

export function listKnowledgeItems(): KnowledgeItem[] {
  return getStore().knowledgeItems;
}

export function pendingSopReview(): KnowledgeItem[] {
  return listKnowledgeItems().filter((k) => k.status === "pending_review");
}
