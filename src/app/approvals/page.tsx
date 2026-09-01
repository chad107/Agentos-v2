import { listProposals } from "@/core";
import { ProposalCard } from "@/components/approvals/ProposalCard";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ActionProposal } from "@/domain";

function List({ items, empty }: { items: ActionProposal[]; empty: string }) {
  if (!items.length) return <EmptyState title={empty} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((p) => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}

/**
 * Approval Centre — single queue for every consequential proposal
 * (03_DASHBOARD_UX_SPEC.md "2. Approval Centre").
 */
export default function ApprovalsPage() {
  const all = listProposals();
  const decidable = (p: ActionProposal) => p.status === "pending" || p.status === "clarification_requested";

  const needsMe = all.filter(decidable);
  const urgent = needsMe.filter((p) => p.urgency === "urgent" || p.urgency === "high");
  const safety = needsMe.filter((p) => p.category === "safety");
  const financial = needsMe.filter((p) => p.category === "financial");
  const customer = needsMe.filter((p) => p.category === "customer");
  const operations = needsMe.filter((p) => p.category === "operations");
  const draftMessages = needsMe.filter((p) => p.actionType.includes("_draft") && typeof p.payload.body === "string");
  const orders = needsMe.filter((p) => p.actionType.includes("purchase_order") || p.actionType.includes("order"));
  const approved = all.filter((p) => p.status === "approved" || p.status === "approved_simulation" || p.status === "completed");
  const rejected = all.filter((p) => p.status === "rejected");

  const tabs: TabItem[] = [
    { key: "needs-me", label: "Needs me", count: needsMe.length, content: <List items={needsMe} empty="No approvals are waiting on you." /> },
    { key: "urgent", label: "Urgent", count: urgent.length, content: <List items={urgent} empty="Nothing urgent right now." /> },
    { key: "safety", label: "Safety", count: safety.length, content: <List items={safety} empty="No safety approvals pending." /> },
    { key: "financial", label: "Financial", count: financial.length, content: <List items={financial} empty="No financial approvals pending." /> },
    { key: "customer", label: "Customer", count: customer.length, content: <List items={customer} empty="No customer approvals pending." /> },
    { key: "operations", label: "Operations", count: operations.length, content: <List items={operations} empty="No operations approvals pending." /> },
    { key: "drafts", label: "Draft messages", count: draftMessages.length, content: <List items={draftMessages} empty="No draft messages waiting for review." /> },
    { key: "orders", label: "Orders/POs", count: orders.length, content: <List items={orders} empty="No purchase orders are proposed. Placing orders autonomously is not permitted at launch." /> },
    { key: "approved", label: "Approved", count: approved.length, content: <List items={approved} empty="Nothing has been approved yet." /> },
    { key: "rejected", label: "Rejected", count: rejected.length, content: <List items={rejected} empty="Nothing has been rejected." /> }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Approval Centre</h1>
        <p className="text-sm text-ink-500">
          Every consequential action passes through here first. AgentOS v1 never executes a proposal autonomously.
        </p>
      </div>
      <Tabs items={tabs} initialKey="needs-me" />
    </div>
  );
}
