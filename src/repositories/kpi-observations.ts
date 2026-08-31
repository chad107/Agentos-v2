/**
 * KPI observation history. In-memory, process-lifetime only (matches
 * src/data/store.ts's existing persistence model). Nothing is recorded
 * automatically on page render — recording is an explicit action
 * (`POST /api/kpis`, or a future scheduled job) so reads never have a
 * hidden side effect. See src/domain/platform.ts `KPIObservation`.
 */

import type { DivisionKey, KPIObservation } from "@/domain/platform";
import { allDivisionSnapshots } from "./divisions";
import { getCurrentTenant } from "@/lib/tenant-context";
import { makeId } from "@/lib/ids";
import { now, toISO } from "@/lib/dates";

const observations: KPIObservation[] = [];

export function recordKpiObservations(): KPIObservation[] {
  const tenantId = getCurrentTenant().id;
  const observedAt = toISO(now());
  const recorded: KPIObservation[] = [];

  for (const snapshot of allDivisionSnapshots()) {
    for (const kpi of snapshot.kpis) {
      if (kpi.value === null) continue;
      const observation: KPIObservation = {
        id: makeId("kpiobs"),
        tenantId,
        divisionKey: snapshot.config.key,
        kpiLabel: kpi.label,
        value: kpi.value,
        observedAt
      };
      observations.push(observation);
      recorded.push(observation);
    }
  }
  return recorded;
}

export function listKpiObservations(filter?: { divisionKey?: DivisionKey; limit?: number }): KPIObservation[] {
  let result = observations.slice().reverse();
  if (filter?.divisionKey) result = result.filter((o) => o.divisionKey === filter.divisionKey);
  if (filter?.limit) result = result.slice(0, filter.limit);
  return result;
}
