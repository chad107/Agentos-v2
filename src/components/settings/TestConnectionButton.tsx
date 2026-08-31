"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { IntegrationId } from "@/domain";

export function TestConnectionButton({ integrationId }: { integrationId: IntegrationId }) {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function test() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/test`, { method: "POST" });
      const data = await res.json();
      setResult(data.message ?? "Tested.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" disabled={busy} onClick={test}>
        {busy ? "Testing…" : "Test connection"}
      </Button>
      {result ? <p className="max-w-[220px] text-right text-xs text-ink-500">{result}</p> : null}
    </div>
  );
}
