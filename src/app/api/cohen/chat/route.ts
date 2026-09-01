import { getRecommendation, askCohenQuestion } from "@/core";
import { ok } from "@/lib/api";
import { parseJsonBody, z } from "@/lib/validation";

const ChatBodySchema = z
  .object({
    question: z.string().trim().min(1, "A question is required."),
    recommendationId: z.string().trim().min(1).optional()
  })
  .strict();

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, ChatBodySchema);
  if (!parsed.ok) return parsed.response;

  const recommendation = parsed.data.recommendationId ? getRecommendation(parsed.data.recommendationId) : undefined;
  const answer = askCohenQuestion(parsed.data.question, { recommendation });
  return ok({ answer });
}
