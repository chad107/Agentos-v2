import { listAccountingItems, billsDueSoon, depositsExpected, statementsNeedingCrossCheck, exceptions } from "@/repositories";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({
    all: listAccountingItems(),
    billsDueSoon: billsDueSoon(),
    depositsExpected: depositsExpected(),
    statementsNeedingCrossCheck: statementsNeedingCrossCheck(),
    exceptions: exceptions()
  });
}
