import { listVoiceCalls, voiceKpis } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({ calls: listVoiceCalls(), kpis: voiceKpis() });
}
