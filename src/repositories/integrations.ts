// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { IntegrationId, IntegrationSettings } from "@/domain";
import { getStore } from "@/data/store";
import { allAdapters } from "@/integrations/mock-adapters";
import type { IntegrationHealth } from "@/integrations/types";

export function listIntegrations(): IntegrationSettings[] {
  return getStore().integrationSettings;
}

/**
 * Runs an adapter's health check and returns the result, or `undefined` if
 * no adapter is registered for that id. Wraps `@/integrations/mock-adapters`
 * so route handlers never import the adapter implementations directly —
 * the mock/live adapter roster is Core-internal, per IP_BOUNDARY.md.
 */
export async function testIntegrationConnection(id: IntegrationId): Promise<IntegrationHealth | undefined> {
  const adapter = allAdapters.find((a) => a.id === id);
  if (!adapter) return undefined;
  return adapter.health();
}
