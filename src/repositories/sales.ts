import type { Lead } from "@/domain";
import { getStore } from "@/data/store";
import { minutesBetween, now } from "@/lib/dates";
import { getTenantConfig } from "@/config/tenant";

/** The active company's configured lead-response SLA window, in minutes. */
export function salesResponseSlaMinutes(): number {
  return getTenantConfig().salesResponseSlaMinutes;
}

export function listLeads(): Lead[] {
  return getStore().leads;
}

export function getLead(id: string): Lead | undefined {
  return getStore().leads.find((l) => l.id === id);
}

export function isSlaBreached(lead: Lead, reference: Date = now()): boolean {
  if (lead.respondedAt) return false;
  return new Date(lead.slaDueAt).getTime() < reference.getTime();
}

export function leadsOutsideSla(): Lead[] {
  return listLeads().filter((l) => isSlaBreached(l));
}

export interface SalesKpis {
  newLeadsToday: number;
  medianResponseMinutes: number | null;
  leadsOutsideSlaCount: number;
  quotesAwaitingCustomer: number;
  quotesRequiringManualFollowup: number;
  acceptedAwaitingNextStep: number;
}

export function salesKpis(): SalesKpis {
  const leads = listLeads();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newLeadsToday = leads.filter((l) => new Date(l.createdAt).getTime() >= today.getTime()).length;

  const responseTimes = leads
    .filter((l) => l.respondedAt)
    .map((l) => minutesBetween(new Date(l.createdAt), new Date(l.respondedAt as string)));
  const medianResponseMinutes = responseTimes.length
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)] ?? null
    : null;

  const quotesAwaitingCustomer = leads.filter((l) => l.stage === "quote_sent" || l.stage === "follow_up").length;
  const quotesRequiringManualFollowup = leads.filter((l) => l.stage === "follow_up").length;
  const acceptedAwaitingNextStep = leads.filter((l) => l.stage === "accepted" || l.stage === "deposit_pending").length;

  return {
    newLeadsToday,
    medianResponseMinutes,
    leadsOutsideSlaCount: leadsOutsideSla().length,
    quotesAwaitingCustomer,
    quotesRequiringManualFollowup,
    acceptedAwaitingNextStep
  };
}

export interface CompetitorSignal {
  id: string;
  source: string;
  date: string;
  summary: string;
  suggestedResponse: string;
  confidence: "high" | "medium" | "low";
}

/** Research/Marketing agent output — mocked, sourced and dated per 04_AGENT_ROLES_AND_WORKFLOWS.md. */
export function competitorSignals(): CompetitorSignal[] {
  return [
    {
      id: "signal_1",
      source: "Google Business Profile — competitor posting",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      summary: "A nearby installer is advertising a $500 off ducted install promotion through the end of the month.",
      suggestedResponse: "Consider a time-boxed assessment-fee waiver rather than matching price directly.",
      confidence: "medium"
    },
    {
      id: "signal_2",
      source: "Facebook ad library",
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      summary: "Regional competitor is running a 0%-financing ad targeting the Annapolis Valley.",
      suggestedResponse: "Confirm whether Valley River's financing partner offers a comparable term before responding.",
      confidence: "low"
    }
  ];
}
