import { listAgents } from "@/core";
import { ok } from "@/lib/api";

export async function GET() {
  return ok(listAgents());
}
