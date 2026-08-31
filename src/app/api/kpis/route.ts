/**
 * 01_MASTER_SPEC.md suggested API surface — /api/kpis. GET lists recorded
 * KPI observations (empty until something records one); POST records a
 * snapshot of every division's current, real KPI values (never
 * fabricated — see src/repositories/kpi-observations.ts). Role-gated like
 * the other write-ish demo action, /api/agents/:id/run.
 */
import { DIVISION_KEYS } from "@/domain/platform";
import type { DivisionKey } from "@/domain/platform";
import { listKpiObservations, recordKpiObservations } from "@/repositories";
import { getCurrentUser, hasAtLeastRole } from "@/lib/auth";
import { ok, forbidden, badRequest } from "@/lib/api";

function parseDivisionKey(value: string | null): DivisionKey | undefined {
  if (value && (DIVISION_KEYS as readonly string[]).includes(value)) return value as DivisionKey;
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const divisionParam = searchParams.get("division");
  if (divisionParam && !parseDivisionKey(divisionParam)) {
    return badRequest(`Unknown division "${divisionParam}".`);
  }
  const limit = searchParams.get("limit");
  return ok(
    listKpiObservations({
      divisionKey: parseDivisionKey(divisionParam),
      limit: limit ? Number(limit) : undefined
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
