// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { Recommendation } from "@/domain";
import { getStore } from "@/data/store";
import { buildTop3 } from "@/cohen/orchestrate";

export function listRecommendations(): Recommendation[] {
  return getStore().recommendations;
}

export function getRecommendation(id: string): Recommendation | undefined {
  return getStore().recommendations.find((r) => r.id === id);
}

export function top3Recommendations(): Recommendation[] {
  return getStore()
    .recommendations.filter((r) => r.cohenRank !== null)
    .sort((a, b) => (a.cohenRank ?? 99) - (b.cohenRank ?? 99));
}

/** Re-run Cohen's ranking over the current recommendation set (e.g. after a status change). */
export function reRank(): Recommendation[] {
  const store = getStore();
  store.recommendations = buildTop3(store.recommendations);
  return store.recommendations;
}

export function updateRecommendationStatus(id: string, status: Recommendation["status"]): Recommendation | undefined {
  const store = getStore();
  const idx = store.recommendations.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const current = store.recommendations[idx];
  if (!current) return undefined;
  const updated: Recommendation = { ...current, status };
  store.recommendations[idx] = updated;
  reRank();
  return updated;
}
