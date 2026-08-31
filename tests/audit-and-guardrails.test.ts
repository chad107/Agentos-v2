import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { decideApprove, listActivity, getProposal } from "@/repositories";
import { getStore } from "@/data/store";
import { listVoiceCalls } from "@/repositories/voice";
import { listCustomerCases } from "@/repositories/customers";

describe("AT-14 — every decision creates correlated audit events", () => {
  it("records an approval.decided event (and an action.completed event) when a pending proposal is approved", () => {
    const store = getStore();
    const pending = store.actionProposals.find((p) => p.status === "pending");
    expect(pending).toBeTruthy();
    if (!pending) return;

    const before = listActivity({ entityId: pending.id }).length;
    const result = decideApprove(pending.id, "u_owner");
    expect(result.ok).toBe(true);

    const after = listActivity({ entityId: pending.id });
    expect(after.length).toBeGreaterThan(before);
    expect(after.some((e) => e.eventType === "approval.decided")).toBe(true);

    const updated = getProposal(pending.id);
    expect(updated?.status === "approved_simulation" || updated?.status === "completed").toBe(true);
  });
});

describe("AT-15 — naming: Cohen is canonical, Bob is never shown", () => {
  it("no source file under src/ references the old manager name 'Bob'", () => {
    const root = path.join(__dirname, "..", "src");
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf8");
          if (/\bBob\b/.test(content)) offenders.push(full);
        }
      }
    }
    walk(root);
    expect(offenders).toEqual([]);
  });
});

describe("AT-16 — voice guardrail: no scraped/purchased outbound list", () => {
  it("every outbound call in the demo data carries a consent reference", () => {
    const outbound = listVoiceCalls().filter((c) => c.direction === "outbound");
    for (const call of outbound) {
      expect(call.consentRef).toBeTruthy();
    }
  });

  it("the voice agent has no autonomous outbound-dialer write capability", () => {
    const store = getStore();
    const voiceAgent = store.agents.find((a) => a.id === "voice");
    expect(voiceAgent?.systemsWrite).toEqual([]);
  });
});

describe("AT-17 — customer/service never issues a final technical sign-off", () => {
  it("uses 'needs technician review' language instead of an AI diagnosis", () => {
    const cases = listCustomerCases();
    const warrantyCase = cases.find((c) => c.category === "warranty");
    expect(warrantyCase?.status).toBe("needs_technician_review");
    expect(warrantyCase?.summary.toLowerCase()).toContain("needs technician review");
  });
});
