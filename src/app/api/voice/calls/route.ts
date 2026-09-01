import { listVoiceCalls, voiceKpis } from "@/core";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({ calls: listVoiceCalls(), kpis: voiceKpis() });
}
