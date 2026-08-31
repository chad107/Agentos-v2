import { decideReject } from "@/repositories";
import { getCurrentUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason : "";
  if (!reason.trim()) return badRequest("A reason is required to reject a proposal.");

  const result = decideReject(params.id, user.id, reason);
  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
