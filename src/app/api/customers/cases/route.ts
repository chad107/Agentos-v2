import { listCustomerCases } from "@/core";
import { ok } from "@/lib/api";

export async function GET() {
  return ok(listCustomerCases());
}
