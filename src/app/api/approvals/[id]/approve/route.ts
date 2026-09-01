import { decideApprove, decideEditAndApprove, getProposal, getCurrentUser, canUserApprove } from "@/core";
import { ok, notFound, forbidden, badRequest } from "@/lib/api";
import { parseJsonBody, z } from "@/lib/validation";

const ApproveBodySchema = z
  .object({
    editedPayload: z.record(z.unknown()).optional()
  })
  .strict();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const proposal = getProposal(params.id);
  if (!proposal) return notFound("Proposal not found.");
  if (!canUserApprove(user.role, proposal.approverRole)) {
    return forbidden(`${user.name} does not have an approver-eligible role for this proposal.`);
  }

  const parsed = await parseJsonBody(req, ApproveBodySchema);
  if (!parsed.ok) return parsed.response;
  const { editedPayload } = parsed.data;

  const result = editedPayload
    ? decideEditAndApprove(params.id, user.id, editedPayload)
    : decideApprove(params.id, user.id);

  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
