import { listAccountingItems, billsDueSoon, statementsNeedingCrossCheck, exceptions } from "@/repositories";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KpiRow } from "@/components/ui/KpiRow";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AccountingItem } from "@/domain";

function ItemRow({ item }: { item: AccountingItem }) {
  return (
    <div id={item.id} className="scroll-mt-20 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border p-2.5 text-sm">
      <div>
        <p className="font-medium text-ink-900">{item.vendorOrCustomerName}</p>
        <p className="text-xs text-ink-500">
          {item.type.replace(/_/g, " ")} · ${item.amount.toLocaleString()}
          {item.dueAt ? ` · due ${new Date(item.dueAt).toLocaleDateString()}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {item.duplicateRisk ? <Badge className="bg-status-urgentBg text-status-urgent">Duplicate risk</Badge> : null}
        <Badge className="bg-surface-muted text-ink-700">{item.status.replace(/_/g, " ")}</Badge>
      </div>
    </div>
  );
}

export default function AccountingPage() {
  const all = listAccountingItems();
  const vendorBills = all.filter((i) => i.type === "vendor_bill");
  const dueSoon = billsDueSoon();
  const deposits = all.filter((i) => i.type === "deposit");
  const statements = statementsNeedingCrossCheck();
  const invoicesAwaitingHandoff = all.filter((i) => i.type === "customer_invoice" && i.status === "awaiting_review");
  const exceptionList = exceptions();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Accounting</h1>
        <p className="text-sm text-ink-500">
          Prevent missed bills, invoices and deposits — with no banking access and no autonomous payments.
        </p>
      </div>

      <KpiRow
        items={[
          { label: "Vendor bills captured", value: vendorBills.length },
          { label: "Due in 3 business days", value: dueSoon.length },
          { label: "Deposits tracked", value: deposits.length },
          { label: "Statements to cross-check", value: statements.length }
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Vendor invoices / bills</h2>
        <div className="space-y-2">{vendorBills.map((i) => <ItemRow key={i.id} item={i} />)}</div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Deposits</h2>
        {deposits.length ? (
          <div className="space-y-2">{deposits.map((i) => <ItemRow key={i.id} item={i} />)}</div>
        ) : (
          <EmptyState title="No deposits are currently tracked." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Final invoices awaiting handoff</h2>
        {invoicesAwaitingHandoff.length ? (
          <div className="space-y-2">{invoicesAwaitingHandoff.map((i) => <ItemRow key={i.id} item={i} />)}</div>
        ) : (
          <EmptyState title="No final invoices are waiting on handoff." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Statements needing cross-check</h2>
        {statements.length ? (
          <div className="space-y-2">{statements.map((i) => <ItemRow key={i.id} item={i} />)}</div>
        ) : (
          <EmptyState title="No vendor statements are awaiting cross-check." />
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Exceptions</h2>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {exceptionList.length ? (
            exceptionList.map((i) => <ItemRow key={i.id} item={i} />)
          ) : (
            <p className="text-sm text-ink-500">No accounting exceptions right now.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
