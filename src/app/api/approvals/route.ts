import type { ProposalStatus } from "@/domain";
import { listProposals } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ProposalStatus | null;
  return ok(listProposals(status ? { status } : undefined));
}
