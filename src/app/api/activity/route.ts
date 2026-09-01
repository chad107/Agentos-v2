import { AUDIT_ACTOR_TYPES } from "@/domain";
import { listActivity } from "@/core";
import { ok } from "@/lib/api";
import { parseQuery, optionalPositiveIntParam, z } from "@/lib/validation";

const ActivityQuerySchema = z.object({
  limit: optionalPositiveIntParam,
  entityType: z.string().trim().min(1).optional(),
  actorType: z.enum(AUDIT_ACTOR_TYPES).optional()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = parseQuery(searchParams, ActivityQuerySchema);
  if (!parsed.ok) return parsed.response;
  return ok(listActivity(parsed.data));
}
