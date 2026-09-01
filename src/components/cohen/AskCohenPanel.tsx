"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { useAskCohen } from "./ask-cohen-context";
// Deliberate, documented exception to the Core/Dashboard import-boundary
// rule (.eslintrc.json `overrides`, PRODUCTION_READINESS_CHECKLIST.md
// Lane 1): this is a "use client" component, so it cannot import `@/core`
// — that barrel transitively pulls in server-only modules (the store's
// node:sqlite persistence) that must never reach a client bundle.
// `suggestedQuestions` is pure canned-prompt text with no proprietary
// reasoning or data access, so importing it directly is low-risk; see
// IP_BOUNDARY.md.
import { suggestedQuestions } from "@/cohen/ask-cohen";

interface Turn {
  question: string;
  answer: string;
}

export function AskCohenPanel() {
  const { open, closePanel, contextRecommendation } = useAskCohen();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = suggestedQuestions({ recommendation: contextRecommendation ?? undefined });

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("/api/cohen/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, recommendationId: contextRecommendation?.id })
      });
      const data = await res.json();
      setTurns((t) => [...t, { question, answer: data.answer ?? "I couldn't find an answer to that yet." }]);
    } catch {
      setTurns((t) => [...t, { question, answer: "Something went wrong reaching Cohen. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onClose={closePanel} title="Ask Cohen">
      <div className="flex h-full flex-col gap-4">
        {contextRecommendation ? (
          <div className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-500">
            Talking about: <span className="font-medium text-ink-700">{contextRecommendation.title}</span>
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto">
          {turns.length === 0 ? (
            <p className="text-sm text-ink-500">
              Ask about anything on screen — Cohen answers using linked evidence, not guesses.
            </p>
          ) : (
            turns.map((t, i) => (
              <div key={i} className="space-y-1.5">
                <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white">
                  {t.question}
                </p>
                <p className="max-w-[85%] rounded-lg rounded-bl-sm bg-surface-muted px-3 py-2 text-sm text-ink-900">
                  {t.answer}
                </p>
              </div>
            ))
          )}
          {loading ? <p className="text-sm text-ink-400">Cohen is thinking…</p> : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-surface-border px-2.5 py-1 text-xs text-ink-500 hover:bg-surface-muted"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2 border-t border-surface-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <label htmlFor="ask-cohen-input" className="sr-only">
            Ask Cohen a question
          </label>
          <input
            id="ask-cohen-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Cohen…"
            className="flex-1 rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-500"
          />
          <Button type="submit" disabled={loading}>
            Ask
          </Button>
        </form>
      </div>
    </Drawer>
  );
}
