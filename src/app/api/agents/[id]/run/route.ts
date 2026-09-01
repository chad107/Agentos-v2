/**
 * Role-gated per 08_API_AND_EVENT_SPEC.md. Triggers a demo re-run: in this
 * mock build there is no live agent process to invoke, so this records an
 * audit event and refreshes `lastRunAt` — it never bypasses the approval
 * engine and cannot itself execute a consequential action.
 */
import type { AgentId } from "@/domain";
import { getAgent, markAgentRunTriggered, getCurrentUser, hasAtLeastRole, recordEvent } from "@/core";
import { toISO, now } from "@/lib/dates";
import { ok, notFound, forbidden } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!hasAtLeastRole(user, "administrator")) {
    return forbidden("Only administrators and above may trigger an agent run.");
  }

  const agentId = params.id as AgentId;
  const agent = getAgent(agentId);
  if (!agent) return notFound("Agent not found.");

  markAgentRunTriggered(agentId);

  recordEvent({
    actorType: "human",
    actorId: user.id,
    eventType: "agent.run_triggered",
    entityType: "agent",
    entityId: agentId,
    summary: `${user.name} manually triggered a run of ${agent.name}.`
  });

  return ok({ agentId, triggeredBy: user.id, triggeredAt: toISO(now()) });
}
