// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import type { IntegrationSettings } from "@/domain";
import { getStore } from "@/data/store";

export function listIntegrations(): IntegrationSettings[] {
  return getStore().integrationSettings;
}
