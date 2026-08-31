import { listLeads, salesKpis, competitorSignals } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({ leads: listLeads(), kpis: salesKpis(), competitorSignals: competitorSignals() });
}
