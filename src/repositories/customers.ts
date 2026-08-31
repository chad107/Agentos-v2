import type { CustomerCase } from "@/domain";
import { getStore } from "@/data/store";

export function listCustomerCases(): CustomerCase[] {
  return getStore().customerCases;
}

export function getCustomerCase(id: string): CustomerCase | undefined {
  return getStore().customerCases.find((c) => c.id === id);
}

export function openCustomerCases(): CustomerCase[] {
  return listCustomerCases().filter((c) => c.status !== "resolved");
}
