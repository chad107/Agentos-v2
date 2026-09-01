import { decideClarify, getProposal, getCurrentUser, canUserApprove } from "@/core";
import { ok, badRequest, notFound, forbidden } from "@/lib/api";
import { parseJsonBody, z } from "@/lib/validation";

const ClarifyBodySchema = z
  .object({
    question: z.string().trim().min(1).optional()
  })
  .strict();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const proposal = getProposal(params.id);
  if (!proposal) return notFound("Proposal not found.");
  if (!canUserApprove(user.role, proposal.approverRole)) {
    return forbidden(`${user.name} does not have an approver-eligible role for this proposal.`);
  }

  const parsed = await parseJsonBody(req, ClarifyBodySchema);
  if (!parsed.ok) return parsed.response;
  const question = parsed.data.question ?? "Can you clarify before I decide?";

  const result = decideClarify(params.id, user.id, question);
  if (!result.ok) {
    return result.error === "Proposal not found." ? notFound(result.error) : badRequest(result.error);
  }
  return ok(result.proposal);
}
