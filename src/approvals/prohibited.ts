/**
 * The prohibited-action list. Source: CLAUDE.md "Authority model — MUST NOT",
 * 05_PERMISSIONS_AND_APPROVALS.md "PROHIBITED" class.
 *
 * This is intentionally the single place these action types are enumerated.
 * src/approvals/engine.ts imports it to refuse creation AND approval of any
 * matching proposal — two independent checks (defense in depth) so a bug in
 * one does not silently open a path to a prohibited action. Tests in
 * tests/approvals.test.ts assert both checks independently (AT-03).
 */
export const PROHIBITED_ACTION_TYPES = [
  "pay_bill",
  "transfer_money",
  "move_money",
  "access_banking",
  "place_order_final",
  "send_customer_correspondence_autonomous",
  "make_legal_commitment",
  "delete_business_record",
  "change_system_setting",
  "final_hvac_trade_signoff",
  "destructive_action",
  "cyber_risky_action"
] as const;

export type ProhibitedActionType = (typeof PROHIBITED_ACTION_TYPES)[number];

export function isProhibitedActionType(actionType: string): boolean {
  return (PROHIBITED_ACTION_TYPES as readonly string[]).includes(actionType);
}
