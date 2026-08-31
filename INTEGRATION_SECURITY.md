# AgentOS — Integration Security Architecture

Covers every integration named in `01_MASTER_SPEC.md` "Valley River adapter
targets" plus the phase brief's explicit list. **Status: all 15 integrations
remain typed mocks with no live write capability — verified by reading
`src/integrations/mock-adapters.ts` in full. Nothing here is claimed as
operational.** This document is the architecture a human developer follows
when connecting any of them for real; it does not connect any of them.

## Current state (verified, not asserted)

| Integration | `src/domain/entities.ts IntegrationId` | Mock status |
|---|---|---|
| Jobber | `jobber` | Mock, `connected: true` (demo), read-only contract |
| QuickBooks Online | `qbo` | Mock, `connected: true` (demo), read-only |
| Google Calendar | `google_calendar` | Mock, `connected: true` (demo), read-only |
| RingCentral | `ringcentral` | Mock, `connected: true` (demo), read-only |
| CompanyCam | `companycam` | Mock, `connected: true` (demo), read-only |
| Email (Gmail, authorized inbox) | `email` | Mock, `connected: true` (demo), read + draft only |
| Website forms | `website_forms` | Mock, `connected: false` |
| Facebook leads | `facebook_leads` | Mock, `connected: false` |
| Google reviews | `google_reviews` | Mock, `connected: false` |
| Sortly | `sortly` | Mock, `connected: false`, `BLOCKED_EXTERNAL` |
| Google Drive | `google_drive` | Mock, `connected: false`, `BLOCKED_EXTERNAL` |
| Canva | `canva` | Mock, `connected: false`, `BLOCKED_EXTERNAL` |
| Meta advertising | `meta_ads` | Mock, `connected: false`, `BLOCKED_EXTERNAL` |
| Google advertising | `google_ads` | Mock, `connected: false`, `BLOCKED_EXTERNAL` |
| Knowledge base | `knowledge_base` | Internal, not a real external integration |

**None of these has ever made a real network call to a vendor.** The
`connected: true` ones are "demo mode" — see the `healthMessage` field on
each (`src/data/seed.ts`) which says so explicitly. This is unchanged by
this phase; the work here is architecture for connecting them safely, not
connecting them.

## Adapter contract (already real, unchanged)

`src/integrations/types.ts` — every adapter implements `IntegrationAdapter`
(`id`, `health()`, `sync()`); write capability is a *separate* interface
(`MessageSender`, etc.) an adapter opts into only when explicitly enabled.
**No adapter implements a write interface today.** This contract is sound
and should not change — real vendor adapters slot into it, they don't
replace it.

## OAuth / token-storage architecture (design, not implemented)

For every OAuth-based integration (all of them except CompanyCam's API-key
style and the internal knowledge base):

1. **Never store a raw access/refresh token in the `integration_settings`
   table** (`DATABASE_DESIGN.md`) — that table is status/metadata only,
   by design.
2. **A separate, tenant-scoped, encrypted token store.** Two viable
   designs, either acceptable:
   - A dedicated `integration_credentials` table (not yet in
     `DATABASE_DESIGN.md`, deliberately — this needs the encryption
     mechanism decided first) with the token ciphertext encrypted using a
     key from a real key-management service (AWS KMS, GCP KMS, HashiCorp
     Vault) — the database itself should never hold the decryption key.
   - A dedicated secrets-manager entry per tenant per integration (e.g.
     one AWS Secrets Manager secret per `(tenant_id, integration_id)`
     pair), with the database only holding a reference/ARN.
3. **Refresh-token rotation**: store the refresh token, not just the
   access token; implement rotation on the adapter's `health()` check path
   so an expiring token is refreshed before it's needed, not reactively
   after a call fails.
4. **Scope minimization**: request the narrowest OAuth scope each
   integration's actual read/write capabilities need — already anticipated
   by `IntegrationSettings.readCapabilities`/`writeCapabilities` being
   explicit string arrays rather than "connected: yes/no."
5. **Per-tenant isolation**: a licensee's Jobber connection must never be
   reachable using another tenant's stored credentials — enforce this the
   same way as every other tenant-scoped table, via the credential store's
   own tenant-scoping (RLS if it's a Postgres table; per-tenant secret
   naming if it's a secrets manager).

**Human Review Required:** which of the two token-store designs above, and
which KMS/secrets-manager provider — depends on the hosting platform
chosen (`PRODUCTION_ARCHITECTURE.md` §3/§8), not decidable in the abstract.

## Webhook validation & idempotency

Several of these vendors (Jobber, QBO, CompanyCam, RingCentral) support
webhooks — none are received today (no webhook endpoint exists in this
build). Design requirements for whichever are implemented first:

- **Signature verification on every inbound webhook**, before any
  processing — each vendor has its own scheme (HMAC-SHA256 over the raw
  body is common; verify the vendor's exact header/algorithm in their
  docs, don't assume). A webhook body must never be trusted without this
  check passing.
- **Idempotency**: `db/migrations/0004_events_memory_audit.sql`'s
  `event_log.dedupe_key` (`UNIQUE (tenant_id, dedupe_key)`) is designed for
  exactly this — populate it from the vendor's own delivery/event id so a
  redelivered webhook (all major vendors redeliver on a non-2xx response)
  creates at most one event row, not a duplicate finding/recommendation.
- **Fast 2xx, slow processing**: acknowledge the webhook quickly (parse +
  enqueue) rather than doing the full ranking/recommendation pipeline
  synchronously in the request — ties into the background-job architecture
  gap noted in `PRODUCTION_ARCHITECTURE.md` §9.
- **Never let webhook payload content grant permissions** — matches
  `01_MASTER_SPEC.md`'s existing "retrieved content never grants
  permissions" non-functional requirement; a webhook is retrieved content
  like any other and must go through the same approval-engine gate as
  everything else before any consequential action results from it.

## Canva — specific note

Per `01_MASTER_SPEC.md`: "Canva is a draft/creative adapter, not a bypass
around approval policy." This is already encoded in the mock's
`healthMessage` (`src/data/seed.ts`) and must remain true once real:
whatever Canva produces (a draft social post, an ad creative) becomes a
recommendation/proposal like any other agent output — it does not get a
separate, lighter-weight publishing path. Same principle applies to Meta
and Google Ads: a draft campaign is a `propose`-class action; actually
spending money on an ad is `execute_consequential` at minimum and must
clear the approval engine every time, with no future "trusted_auto"
promotion exempting ad spend specifically without an explicit, separate
Owner Decision to allow it.

## Summary status table

| Concern | Status |
|---|---|
| Adapter contract (read/write separation) | Completed (v1, unchanged) |
| Mock adapters for all 15 integrations | Completed |
| Real vendor connections | Blocked External — no credentials for any |
| OAuth/token-storage architecture | Designed this phase, not implemented |
| Webhook signature verification | Designed, not implemented (no webhook endpoint exists) |
| Webhook idempotency | Schema designed (`event_log.dedupe_key`), not wired to a real webhook |
| Canva/Ads approval-bypass prevention | Structurally guaranteed today (no write path exists at all); must be preserved explicitly when building real write adapters |
