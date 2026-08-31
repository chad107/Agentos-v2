"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ActionProposal } from "@/domain";

type Mode = "idle" | "rejecting" | "clarifying";

export function ApprovalActions({
  proposal,
  onDecided,
  size = "md"
}: {
  proposal: ActionProposal;
  onDecided?: (proposal: ActionProposal) => void;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decidable = proposal.status === "pending" || proposal.status === "clarification_requested";

  async function call(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${proposal.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMode("idle");
      setNote("");
      onDecided?.(data as ActionProposal);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!decidable && proposal.status !== "clarification_requested") {
    return (
      <p className="text-xs text-ink-400">
        {proposal.status === "approved_simulation" && "Approved — execution simulated (no live write adapter enabled)."}
        {proposal.status === "completed" && "Completed."}
        {proposal.status === "rejected" && "Rejected."}
        {proposal.status === "expired" && "Expired."}
        {proposal.status === "executing" && "Executing…"}
        {proposal.status === "failed" && "Failed — see activity log for recovery details."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-status-urgent">{error}</p> : null}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <Button size={size} disabled={busy} onClick={() => call("approve")}>
            Approve
          </Button>
          <Button size={size} variant="secondary" disabled={busy} onClick={() => setMode("rejecting")}>
            Reject
          </Button>
          <Button size={size} variant="ghost" disabled={busy} onClick={() => setMode("clarifying")}>
            Ask Cohen
          </Button>
        </div>
      )}

      {mode === "rejecting" && (
        <div className="space-y-2 rounded-lg border border-surface-border bg-surface-subtle p-2.5">
          <label className="block text-xs font-medium text-ink-700" htmlFor={`reject-reason-${proposal.id}`}>
            Reason for rejecting
          </label>
          <textarea
            id={`reject-reason-${proposal.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-surface-border px-2 py-1.5 text-sm focus:border-brand-500"
            placeholder="e.g. I'll handle this one personally."
          />
          <div className="flex gap-2">
            <Button size="sm" variant="danger" disabled={busy || !note.trim()} onClick={() => call("reject", { reason: note })}>
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "clarifying" && (
        <div className="space-y-2 rounded-lg border border-surface-border bg-surface-subtle p-2.5">
          <label className="block text-xs font-medium text-ink-700" htmlFor={`clarify-q-${proposal.id}`}>
            What would you like Cohen to clarify?
          </label>
          <textarea
            id={`clarify-q-${proposal.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-surface-border px-2 py-1.5 text-sm focus:border-brand-500"
            placeholder="e.g. Do we have confirmation the customer is home tomorrow?"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || !note.trim()} onClick={() => call("clarify", { question: note })}>
              Send
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
