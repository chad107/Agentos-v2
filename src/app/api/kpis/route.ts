/**
 * 01_MASTER_SPEC.md suggested API surface — /api/kpis. GET lists recorded
 * KPI observations (empty until something records one); POST records a
 * snapshot of every division's current, real KPI values (never
 * fabricated — see src/repositories/kpi-observations.ts). Role-gated like
 * the other write-ish demo action, /api/agents/:id/run.
 */
import { DIVISION_KEYS } from "@/domain/platform";
import { listKpiObservations, recordKpiObservations, getCurrentUser, hasAtLeastRole } from "@/core";
import { ok, forbidden } from "@/lib/api";
import { parseQuery, optionalPositiveIntParam, z } from "@/lib/validation";

const KpiQuerySchema = z.object({
  division: z.enum(DIVISION_KEYS).optional(),
  limit: optionalPositiveIntParam
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = parseQuery(searchParams, KpiQuerySchema);
  if (!parsed.ok) return parsed.response;
  return ok(
    listKpiObservations({
      divisionKey: parsed.data.division,
      limit: parsed.data.limit
    })
  );
}

export async function POST() {
  const user = getCurrentUser();
  if (!hasAtLeastRole(user, "administrator")) {
    return forbidden("Only administrators and above may record a KPI snapshot.");
  }
  return ok({ recorded: recordKpiObservations() }, 201);
}
