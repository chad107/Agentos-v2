import { getRecommendation } from "@/repositories";
import { answerQuestion } from "@/cohen/ask-cohen";
import { ok, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.question === "string" ? body.question : "";
  if (!question.trim()) return badRequest("A question is required.");

  const recommendation = typeof body?.recommendationId === "string" ? getRecommendation(body.recommendationId) : undefined;
  const answer = answerQuestion(question, { recommendation });
  return ok({ answer });
}
