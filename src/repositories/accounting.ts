import type { AccountingItem } from "@/domain";
import { getStore } from "@/data/store";
import { businessDaysFromNow } from "@/lib/dates";

export function listAccountingItems(): AccountingItem[] {
  return getStore().accountingItems;
}

export function billsDueSoon(reference: Date = new Date()): AccountingItem[] {
  const deadline = businessDaysFromNow(3, reference);
  return listAccountingItems().filter(
    (i) => i.type === "vendor_bill" && i.dueAt && new Date(i.dueAt).getTime() <= deadline.getTime()
  );
}

export function depositsExpected(): AccountingItem[] {
  return listAccountingItems().filter((i) => i.type === "deposit" && i.status === "expected");
}

export function statementsNeedingCrossCheck(): AccountingItem[] {
  return listAccountingItems().filter((i) => i.type === "statement" && i.status === "awaiting_review");
}

export function exceptions(): AccountingItem[] {
  return listAccountingItems().filter((i) => i.duplicateRisk || i.status === "overdue" || i.status === "unmatched");
}
