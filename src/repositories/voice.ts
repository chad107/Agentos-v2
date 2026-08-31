import type { VoiceCall } from "@/domain";
import { getStore } from "@/data/store";

export function listVoiceCalls(): VoiceCall[] {
  return getStore().voiceCalls;
}

export interface VoiceKpis {
  callsAnswered: number;
  qualifiedRequests: number;
  transfers: number;
  urgentEscalations: number;
  jobberRequestsCreated: number;
  callsNeedingReview: number;
}

export function voiceKpis(): VoiceKpis {
  const calls = listVoiceCalls();
  return {
    callsAnswered: calls.length,
    qualifiedRequests: calls.filter((c) => c.outcome === "jobber_request_created").length,
    transfers: calls.filter((c) => c.outcome === "transferred").length,
    urgentEscalations: calls.filter((c) => c.urgency === "urgent").length,
    jobberRequestsCreated: calls.filter((c) => c.jobberRequestRef).length,
    callsNeedingReview: calls.filter((c) => c.outcome === "review_needed").length
  };
}
