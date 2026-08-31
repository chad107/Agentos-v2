/**
 * Ask Cohen: deterministic demo chat grounded in the recommendation/evidence
 * the user is currently looking at (AT-12 — answers "why did you flag this?"
 * using the recommendation/evidence without inventing unsupported facts).
 *
 * This intentionally does NOT call an LLM in the demo build (no credentials
 * required to run). It is written behind the ModelProvider interface so a
 * real model can be swapped in later (src/cohen/model-provider.ts) without
 * changing callers.
 */

import type { Recommendation } from "@/domain";
import { CONFIDENCE_COPY } from "@/domain";

export interface AskCohenContext {
  recommendation?: Recommendation;
}

export interface AskCohenTurn {
  question: string;
  answer: string;
}

const WHY_PATTERNS = [/why/i, /flag/i, /matter/i, /#\d/];
const EVIDENCE_PATTERNS = [/evidence/i, /source/i, /where.*from/i, /how do you know/i, /jobber/i];
const NEXT_PATTERNS = [/next/i, /what should/i, /recommend/i, /other option/i];
const DELAY_PATTERNS = [/wait/i, /delay/i, /tomorrow/i, /if i don'?t/i];
const DRAFT_PATTERNS = [/draft/i, /write/i, /email/i, /follow-?up/i];

export function suggestedQuestions(context: AskCohenContext): string[] {
  if (!context.recommendation) {
    return [
      "What needs my attention today?",
      "What's pending approval?",
      "Any safety exceptions right now?"
    ];
  }
  const rank = context.recommendation.cohenRank;
  return [
    rank ? `Why is this #${rank}?` : "Why did you flag this?",
    "What happens if I wait until tomorrow?",
    "Show me the source information.",
    "Draft the follow-up.",
    "What are my other options?"
  ];
}

export function answerQuestion(question: string, context: AskCohenContext): string {
  const rec = context.recommendation;

  if (!rec) {
    return "Open a recommendation, job, or approval and I can answer questions grounded in its evidence. In general: check Needs Attention on Home for anything urgent first.";
  }

  if (DELAY_PATTERNS.some((p) => p.test(question))) {
    return rec.impact
      ? `If this waits: ${rec.impact.label}${rec.impact.value ? ` — ${rec.impact.value}` : ""}. ${rec.whyItMatters}`
      : `Waiting carries risk here: ${rec.whyItMatters}`;
  }

  if (DRAFT_PATTERNS.some((p) => p.test(question))) {
    return `I can prepare a draft for "${rec.decisionRequired}" — open Review to see the proposed action and its exact wording before you approve it.`;
  }

  if (WHY_PATTERNS.some((p) => p.test(question))) {
    return `${rec.whyItMatters} This is why I ranked it ${rec.cohenRank ? `#${rec.cohenRank}` : ""} as ${rec.priority} priority under ${rec.category}.`;
  }

  if (EVIDENCE_PATTERNS.some((p) => p.test(question))) {
    const refs = rec.sourceRefs.join(", ");
    return `This is based on: ${refs || "no linked source records yet"}. Confidence: ${rec.confidence} — ${CONFIDENCE_COPY[rec.confidence]}`;
  }

  if (NEXT_PATTERNS.some((p) => p.test(question))) {
    return `Decision required: ${rec.decisionRequired}. I'd suggest reviewing the evidence, then approving, rejecting, or asking a follow-up before the due time.`;
  }

  return `Here's what I have on "${rec.title}": ${rec.summary} ${rec.whyItMatters}`;
}
