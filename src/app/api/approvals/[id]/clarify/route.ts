import { decideClarify } from "@/repositories";
import { getCurrentUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.question === "string" && body.question.trim() ? body.question : "Can you clarify before I decide?";

  const result = decideClarify(params.id, user.id, question);
  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
