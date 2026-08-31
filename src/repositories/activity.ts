// PROPRIETARY — AgentOS Core. See IP_BOUNDARY.md.
import { listEvents, type AuditFilter } from "@/audit/log";
import { getStore } from "@/data/store";

export function listActivity(filter: AuditFilter = {}) {
  return listEvents(filter);
}

export function listNotifications() {
  return getStore().notifications;
}
