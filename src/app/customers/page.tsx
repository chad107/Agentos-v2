import { listCustomerCases } from "@/core";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, PriorityChip } from "@/components/ui/Badge";
import type { CustomerCase, CustomerCaseCategory } from "@/domain";

const categoryLabels: Record<CustomerCaseCategory, string> = {
  warranty: "Warranty",
  service_repair: "Service / repair",
  existing_install_issue: "Existing install issue",
  general_question: "General question",
  escalated_complaint: "Escalated complaint"
};

const statusStyles: Record<CustomerCase["status"], string> = {
  new: "bg-status-infoBg text-status-info",
  in_progress: "bg-status-infoBg text-status-info",
  awaiting_customer: "bg-surface-muted text-ink-500",
  needs_technician_review: "bg-status-attentionBg text-status-attention",
  resolved: "bg-status-safeBg text-status-safe"
};

const statusLabels: Record<CustomerCase["status"], string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_customer: "Awaiting customer",
  needs_technician_review: "Needs technician review",
  resolved: "Resolved"
};

export default function CustomersPage() {
  const cases = listCustomerCases();
  const categories = Array.from(new Set(cases.map((c) => c.category)));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Customers / Service</h1>
        <p className="text-sm text-ink-500">
          Cohen never invents a diagnosis, warranty coverage or technical conclusion — those stay with a technician.
        </p>
      </div>

      {categories.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-semibold text-ink-900">{categoryLabels[category]}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cases
              .filter((c) => c.category === category)
              .map((c) => (
                <Card key={c.id} id={c.id} className="scroll-mt-20">
                  <CardBody className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">{c.customerName}</p>
                      <PriorityChip priority={c.severity} />
                    </div>
                    <p className="text-sm text-ink-700">{c.summary}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={statusStyles[c.status]}>{statusLabels[c.status]}</Badge>
                      {c.nextActionAt ? (
                        <p className="text-xs text-ink-500">Next: {new Date(c.nextActionAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
