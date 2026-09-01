import { getRecommendation, listProposals, findingsByIds } from "@/core";
import { ok, notFound } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rec = getRecommendation(params.id);
  if (!rec) return notFound("Recommendation not found.");
  const proposals = listProposals().filter((p) => p.recommendationId === rec.id);
  const findings = findingsByIds(rec.findingIds);
  return ok({ recommendation: rec, proposals, findings });
}
