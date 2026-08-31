import type { IntegrationId } from "@/domain";
import { allAdapters } from "@/integrations/mock-adapters";
import { getCurrentUser } from "@/lib/auth";
import { recordEvent } from "@/audit/log";
import { ok, notFound } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const id = params.id as IntegrationId;
  const adapter = allAdapters.find((a) => a.id === id);
  if (!adapter) return notFound("Integration not found.");

  const health = await adapter.health();
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
