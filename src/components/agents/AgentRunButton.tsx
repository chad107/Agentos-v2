"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { AgentId } from "@/domain";

export function AgentRunButton({ agentId }: { agentId: AgentId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not trigger this run.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" disabled={busy} onClick={run}>
        {busy ? "Running…" : "Run now"}
      </Button>
      {error ? <p className="text-xs text-status-urgent">{error}</p> : null}
    </div>
  );
}
