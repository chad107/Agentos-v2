/**
 * Adapter contract. Source: 06_INTEGRATIONS_AND_DATA_CONTRACTS.md.
 *
 * Rule: domain logic never touches a vendor SDK type. Every external system
 * is reached through an adapter that exposes only explicit capabilities.
 * Read (`sync`) is always safe. Write capability is a *separate* interface
 * (`MessageSender`, `JobberWriter`, `QboBillWriter`, ...) that a specific
 * adapter may or may not implement — holding a broad read token never
 * implies broad write authority. See 05_PERMISSIONS_AND_APPROVALS.md.
 */

import type { IntegrationId } from "@/domain";

export interface IntegrationHealth {
  connected: boolean;
  health: "ok" | "degraded" | "error" | "not_configured";
  message: string;
  lastSyncAt: string | null;
}

export interface NormalizedChange {
  id: string;
  integration: IntegrationId;
  entityType: string;
  externalId: string;
  changeType: "created" | "updated" | "deleted";
  occurredAt: string;
  summary: string;
  payload: Record<string, unknown>;
}

/** Every adapter implements at least this: identity, health, and read sync. */
export interface IntegrationAdapter {
  id: IntegrationId;
  health(): Promise<IntegrationHealth>;
  sync(since?: Date): Promise<NormalizedChange[]>;
}

/**
 * Capability interfaces. An adapter opts into one of these ONLY when a write
 * integration has been explicitly enabled for that specific action type.
 * These are never granted implicitly by connecting an adapter for reads.
 */
export interface MessageSender {
  /** Drafts only reach a real customer once a human-approved proposal executes. */
  sendMessage(input: { to: string; channel: "email" | "sms"; subject?: string; body: string }): Promise<{
    sent: boolean;
    providerRef: string;
  }>;
}

export interface JobberWriter {
  createFollowUpTask(input: { jobberRef: string; note: string }): Promise<{ created: boolean; providerRef: string }>;
}

export interface QboBillWriter {
  createBillDraft(input: {
    vendorRef: string;
    amount: number;
    dueAt: string;
    memo: string;
  }): Promise<{ created: boolean; providerRef: string }>;
}

export interface PurchaseOrderWriter {
  createPurchaseOrderDraft(input: {
    supplier: string;
    lines: { model: string; quantity: number }[];
  }): Promise<{ created: boolean; providerRef: string }>;
}
