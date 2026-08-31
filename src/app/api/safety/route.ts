import { listSafetyRequirements, missingOrEscalatedJsa, ladderInspections } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({
    all: listSafetyRequirements(),
    missingOrEscalated: missingOrEscalatedJsa(),
    ladderInspections: ladderInspections()
  });
}
