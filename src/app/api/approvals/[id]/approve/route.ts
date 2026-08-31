import { decideApprove, decideEditAndApprove } from "@/repositories";
import { getCurrentUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  let editedPayload: Record<string, unknown> | undefined;
  try {
    const body = await req.json();
    editedPayload = body?.editedPayload;
  } catch {
    // no body / not JSON — approve as-is
  }

  const result = editedPayload
    ? decideEditAndApprove(params.id, user.id, editedPayload)
    : decideApprove(params.id, user.id);

  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
