import { PROPOSAL_STATUSES } from "@/domain";
import { listProposals } from "@/core";
import { ok } from "@/lib/api";
import { parseQuery, z } from "@/lib/validation";

const ApprovalsQuerySchema = z.object({
  status: z.enum(PROPOSAL_STATUSES).optional()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = parseQuery(searchParams, ApprovalsQuerySchema);
  if (!parsed.ok) return parsed.response;
  return ok(listProposals(parsed.data.status ? { status: parsed.data.status } : undefined));
}
