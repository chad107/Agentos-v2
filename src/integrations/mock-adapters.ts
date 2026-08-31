/**
 * Mock adapters so the app is fully demoable without credentials
 * (CLAUDE.md "Development rules"; PROMPT_TO_START_CLAUDE_CODE.md #7).
 *
 * Each mock implements IntegrationAdapter (read-only: health + sync).
 * None of these implement a write capability interface — at launch,
 * MessageSender / JobberWriter / QboBillWriter / PurchaseOrderWriter are
 * intentionally left unimplemented so there is no code path to real
 * autonomous execution. src/approvals/engine.ts enforces this at the
 * policy layer as well, in case an adapter is added later — defense in
 * depth, not a single point of failure.
 */

import type { IntegrationId } from "@/domain";
import type { IntegrationAdapter, IntegrationHealth, NormalizedChange } from "./types";

function makeMockAdapter(id: IntegrationId, label: string, connected: boolean): IntegrationAdapter {
  return {
    id,
    async health(): Promise<IntegrationHealth> {
      return {
        connected,
        health: connected ? "ok" : "not_configured",
        message: connected
          ? `${label} mock adapter is healthy (demo mode — no live credentials).`
          : `${label} is not connected. Configure credentials in Settings > Integrations to enable a live adapter.`,
        lastSyncAt: connected ? new Date().toISOString() : null
      };
    },
    async sync(_since?: Date): Promise<NormalizedChange[]> {
      // Demo mode: changes are pre-seeded (see src/data/seed.ts) rather than
      // pulled live. A real adapter implementation would call the vendor API
      // here and return NormalizedChange[] through the same contract.
      return [];
    }
  };
}

export const jobberAdapter = makeMockAdapter("jobber", "Jobber", true);
export const qboAdapter = makeMockAdapter("qbo", "QuickBooks Online", true);
export const googleCalendarAdapter = makeMockAdapter("google_calendar", "Google Calendar", true);
export const ringCentralAdapter = makeMockAdapter("ringcentral", "RingCentral", true);
export const companyCamAdapter = makeMockAdapter("companycam", "CompanyCam", true);
export const emailAdapter = makeMockAdapter("email", "Authorized email inbox", true);
export const websiteFormsAdapter = makeMockAdapter("website_forms", "Website forms", false);
export const facebookLeadsAdapter = makeMockAdapter("facebook_leads", "Facebook leads", false);
export const googleReviewsAdapter = makeMockAdapter("google_reviews", "Google reviews", false);
export const knowledgeBaseAdapter = makeMockAdapter("knowledge_base", "Knowledge base", true);

export const allAdapters: IntegrationAdapter[] = [
  jobberAdapter,
  qboAdapter,
  googleCalendarAdapter,
  ringCentralAdapter,
  companyCamAdapter,
  emailAdapter,
  websiteFormsAdapter,
  facebookLeadsAdapter,
  googleReviewsAdapter,
  knowledgeBaseAdapter
];
