import { homeSnapshot } from "@/core";
import { ok } from "@/lib/api";

export async function GET() {
  return ok(homeSnapshot());
}
