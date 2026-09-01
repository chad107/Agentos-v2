import { listLeads, salesKpis, competitorSignals } from "@/core";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({ leads: listLeads(), kpis: salesKpis(), competitorSignals: competitorSignals() });
}
