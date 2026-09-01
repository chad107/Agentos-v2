/**
 * Phase 3A — route-level coverage for the zod request validation added to
 * every write-capable API route (PRODUCTION_READINESS_CHECKLIST.md Lane 1)
 * and for the GET routes whose query parameters are now validated too.
 * Calls the exported route handlers directly with real `Request` objects
 * (no HTTP server needed) against a store reset to a clean seeded state
 * before every test, so results don't depend on test execution order.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { _resetStoreForTests, getStore } from "@/data/store";
import type { ActionProposal } from "@/domain";
import { POST as approveRoute } from "@/app/api/approvals/[id]/approve/route";
import { POST as rejectRoute } from "@/app/api/approvals/[id]/reject/route";
import { POST as clarifyRoute } from "@/app/api/approvals/[id]/clarify/route";
import { GET as approvalsListRoute } from "@/app/api/approvals/route";
import { POST as chatRoute } from "@/app/api/cohen/chat/route";
import { GET as kpisGetRoute } from "@/app/api/kpis/route";
import { GET as activityGetRoute } from "@/app/api/activity/route";

async function jsonRequest(url: string, body?: unknown) {
  return new Request(url, {
    method: "POST",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function rawBodyRequest(url: string, rawBody: string) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: rawBody
  });
}

beforeEach(() => {
  _resetStoreForTests();
});

describe("POST /api/approvals/:id/reject — zod body validation", () => {
  it("400s with no reason in the body", async () => {
    const res = await rejectRoute(await jsonRequest("http://test/api/approvals/prop_001/reject", {}), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reason/i);
  });

  it("400s on a reason that is only whitespace", async () => {
    const res = await rejectRoute(await jsonRequest("http://test/api/approvals/prop_001/reject", { reason: "   " }), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(400);
  });

  it("400s on malformed JSON rather than silently ignoring it", async () => {
    const res = await rejectRoute(rawBodyRequest("http://test/api/approvals/prop_001/reject", "{not valid json"), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid JSON/i);
  });

  it("400s on an unrecognized extra field (strict schema)", async () => {
    const res = await rejectRoute(
      await jsonRequest("http://test/api/approvals/prop_001/reject", { reason: "fine", somethingElse: true }),
      { params: { id: "prop_001" } }
    );
    expect(res.status).toBe(400);
  });

  it("200s and rejects the proposal with a valid reason", async () => {
    const res = await rejectRoute(
      await jsonRequest("http://test/api/approvals/prop_001/reject", { reason: "No longer needed." }),
      { params: { id: "prop_001" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("rejected");
  });
});

describe("POST /api/approvals/:id/approve — zod body validation", () => {
  it("approves as-is with no body at all", async () => {
    const res = await approveRoute(new Request("http://test/api/approvals/prop_001/approve", { method: "POST" }), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(200);
  });

  it("400s when editedPayload is not an object", async () => {
    const res = await approveRoute(
      await jsonRequest("http://test/api/approvals/prop_001/approve", { editedPayload: "not an object" }),
      { params: { id: "prop_001" } }
    );
    expect(res.status).toBe(400);
  });

  it("200s and applies an edited payload when it is a valid object", async () => {
    const res = await approveRoute(
      await jsonRequest("http://test/api/approvals/prop_002/approve", { editedPayload: { body: "Edited body" } }),
      { params: { id: "prop_002" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payload.body).toBe("Edited body");
  });
});

describe("POST /api/approvals/:id/clarify — zod body validation", () => {
  it("falls back to the default question with no body", async () => {
    const res = await clarifyRoute(new Request("http://test/api/approvals/prop_001/clarify", { method: "POST" }), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("clarification_requested");
  });

  it("400s on an empty-string question rather than silently falling back", async () => {
    const res = await clarifyRoute(await jsonRequest("http://test/api/approvals/prop_001/clarify", { question: "" }), {
      params: { id: "prop_001" }
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/cohen/chat — zod body validation", () => {
  it("400s with no question", async () => {
    const res = await chatRoute(await jsonRequest("http://test/api/cohen/chat", {}));
    expect(res.status).toBe(400);
  });

  it("400s with an empty question", async () => {
    const res = await chatRoute(await jsonRequest("http://test/api/cohen/chat", { question: "   " }));
    expect(res.status).toBe(400);
  });

  it("200s with a valid question", async () => {
    const res = await chatRoute(await jsonRequest("http://test/api/cohen/chat", { question: "Why is this flagged?" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.answer).toBe("string");
  });
});

describe("GET /api/kpis — zod query validation", () => {
  it("400s on an unknown division", async () => {
    const res = await kpisGetRoute(new Request("http://test/api/kpis?division=not_a_division"));
    expect(res.status).toBe(400);
  });

  it("400s on a non-numeric limit", async () => {
    const res = await kpisGetRoute(new Request("http://test/api/kpis?limit=abc"));
    expect(res.status).toBe(400);
  });

  it("400s on a negative limit", async () => {
    const res = await kpisGetRoute(new Request("http://test/api/kpis?limit=-5"));
    expect(res.status).toBe(400);
  });

  it("200s with valid, well-typed query params", async () => {
    const res = await kpisGetRoute(new Request("http://test/api/kpis?division=sales&limit=5"));
    expect(res.status).toBe(200);
  });

  it("200s with no query params at all", async () => {
    const res = await kpisGetRoute(new Request("http://test/api/kpis"));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/activity — zod query validation", () => {
  it("400s on an unknown actorType instead of silently ignoring it", async () => {
    const res = await activityGetRoute(new Request("http://test/api/activity?actorType=bogus"));
    expect(res.status).toBe(400);
  });

  it("200s with a valid actorType and limit", async () => {
    const res = await activityGetRoute(new Request("http://test/api/activity?actorType=human&limit=10"));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/approvals/:id/approve — prohibited actions can never execute, even via the route layer", () => {
  it("400s rather than approving a proposal whose permissionClass is prohibited, if one somehow existed in the store", async () => {
    // AT-03 (tests/approvals-engine.test.ts) already proves the engine
    // function itself refuses this; this proves the same guardrail holds
    // when reached through the actual API route (defense in depth — a
    // route bug that skipped calling the engine correctly would show up
    // here even if the engine's own unit tests stayed green).
    const rogue: ActionProposal = {
      id: "prop_rogue_prohibited",
      recommendationId: "rec_001",
      actionType: "pay_bill",
      description: "Should never be approvable.",
      initiatorAgentId: "accounting",
      targetRef: "qbo:vendor_test",
      payload: {},
      permissionClass: "prohibited",
      approverRole: "owner",
      status: "pending",
      evidenceRefs: [],
      confidence: "high",
      urgency: "normal",
      riskIfDelayed: "n/a",
      editable: false,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      category: "financial"
    };
    getStore().actionProposals.push(rogue);

    const res = await approveRoute(new Request("http://test/api/approvals/prop_rogue_prohibited/approve", { method: "POST" }), {
      params: { id: "prop_rogue_prohibited" }
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/prohibited/i);

    // And it was never mutated to any approved-shaped status.
    const stillPending = getStore().actionProposals.find((p) => p.id === "prop_rogue_prohibited");
    expect(stillPending?.status).toBe("pending");
  });
});

describe("GET /api/approvals — zod query validation", () => {
  it("400s on an unknown status instead of an unchecked cast", async () => {
    const res = await approvalsListRoute(new Request("http://test/api/approvals?status=not_a_real_status"));
    expect(res.status).toBe(400);
  });

  it("200s with a valid status", async () => {
    const res = await approvalsListRoute(new Request("http://test/api/approvals?status=pending"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const proposal of body) {
      expect(proposal.status).toBe("pending");
    }
  });
});
