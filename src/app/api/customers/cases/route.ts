import { listCustomerCases } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET() {
  return ok(listCustomerCases());
}
