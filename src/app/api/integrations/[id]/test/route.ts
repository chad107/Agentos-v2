import type { IntegrationId } from "@/domain";
import { testIntegrationConnection, getCurrentUser, recordEvent } from "@/core";
import { ok, notFound } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const id = params.id as IntegrationId;
  const health = await testIntegrationConnection(id);
  if (!health) return notFound("Integration not found.");

  recordEvent({
    actorType: "human",
    actorId: user.id,
    eventType: "integration.test_connection",
    entityType: "integration",
    entityId: id,
    summary: `${user.name} tested the ${id} connection: ${health.health}.`
  });
  return ok(health);
}
