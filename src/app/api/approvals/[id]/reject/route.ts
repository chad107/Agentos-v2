import { decideReject, getProposal } from "@/repositories";
import { getCurrentUser } from "@/lib/auth";
import { canUserApprove } from "@/approvals/engine";
import { ok, badRequest, notFound, forbidden } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const proposal = getProposal(params.id);
  if (!proposal) return notFound("Proposal not found.");
  if (!canUserApprove(user.role, proposal.approverRole)) {
    return forbidden(`${user.name} does not have an approver-eligible role for this proposal.`);
  }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason : "";
  if (!reason.trim()) return badRequest("A reason is required to reject a proposal.");

  const result = decideReject(params.id, user.id, reason);
  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
