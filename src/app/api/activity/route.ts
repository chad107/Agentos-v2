import type { AuditActorType } from "@/domain";
import { AUDIT_ACTOR_TYPES } from "@/domain";
import { listActivity } from "@/repositories";
import { ok } from "@/lib/api";

function parseActorType(value: string | null): AuditActorType | undefined {
  if (value && (AUDIT_ACTOR_TYPES as readonly string[]).includes(value)) {
    return value as AuditActorType;
  }
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  const entityType = searchParams.get("entityType") ?? undefined;
  const actorType = parseActorType(searchParams.get("actorType"));
  return ok(
    listActivity({
      limit: limit ? Number(limit) : undefined,
      entityType,
      actorType
    })
  );
}
