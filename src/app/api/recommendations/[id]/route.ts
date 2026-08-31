import { getRecommendation, listProposals } from "@/repositories";
import { getStore } from "@/data/store";
import { ok, notFound } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rec = getRecommendation(params.id);
  if (!rec) return notFound("Recommendation not found.");
  const proposals = listProposals().filter((p) => p.recommendationId === rec.id);
  const findings = getStore().findings.filter((f) => rec.findingIds.includes(f.id));
  return ok({ recommendation: rec, proposals, findings });
}
