/**
 * Shared request-validation helpers for API routes (Phase 3A, Lane 1 —
 * PRODUCTION_READINESS_CHECKLIST.md "Add zod request-body schema
 * validation to each API route"). Every write-capable route parses its
 * JSON body through a zod schema before touching the repository layer;
 * every route with query parameters validates them the same way. This
 * changes what an API route rejects (malformed input now gets a precise
 * 400 instead of being silently coerced or passed through), not what a
 * well-formed request does — existing golden-path behavior is unchanged.
 */
import { z } from "zod";
import { badRequest } from "@/lib/api";
import type { NextResponse } from "next/server";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  if (!first) return "Invalid request.";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

/**
 * Parses a request body as JSON and validates it against `schema`.
 * An empty/absent body is treated as `{}` before validation (so a schema
 * whose fields are all optional accepts a bodyless request, matching the
 * existing "approve as-is with no body" convention) — but a body that IS
 * present and is not valid JSON is now a 400, not a silently-ignored parse
 * failure.
 */
export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<ParseResult<T>> {
  const raw = await req.text();
  let parsed: unknown = {};
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, response: badRequest("Request body must be valid JSON.") };
    }
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, response: badRequest(formatZodError(result.error)) };
  }
  return { ok: true, data: result.data };
}

/** Validates `URLSearchParams` (coerced to a plain object) against `schema`. */
export function parseQuery<T>(searchParams: URLSearchParams, schema: z.ZodType<T, z.ZodTypeDef, unknown>): ParseResult<T> {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: badRequest(formatZodError(result.error)) };
  }
  return { ok: true, data: result.data };
}

/** Query-string integers arrive as strings; empty string means "not provided". */
export const optionalPositiveIntParam = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.coerce.number().int().positive().optional());

export { z };
