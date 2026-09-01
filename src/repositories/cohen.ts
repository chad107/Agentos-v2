// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
/**
 * Thin wrapper around `@/cohen/ask-cohen` so Dashboard-layer code (API
 * routes, components) never imports `@/cohen/**` directly — Cohen's
 * reasoning logic is Core-internal per IP_BOUNDARY.md. Behavior is
 * unchanged: both functions just forward to the existing implementation.
 */
import type { AskCohenContext } from "@/cohen/ask-cohen";
import { answerQuestion, suggestedQuestions } from "@/cohen/ask-cohen";

export type { AskCohenContext };

export function askCohenQuestion(question: string, context: AskCohenContext): string {
  return answerQuestion(question, context);
}

export function askCohenSuggestedQuestions(context: AskCohenContext): string[] {
  return suggestedQuestions(context);
}
