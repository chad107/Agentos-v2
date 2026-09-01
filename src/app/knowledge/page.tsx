import Link from "next/link";
import { listKnowledgeItems, listDecisions } from "@/core";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { KnowledgeItem, KnowledgeItemType } from "@/domain";

const typeLabels: Record<KnowledgeItemType, string> = {
  note: "Note",
  extracted_rule: "Extracted rule",
  proposed_sop: "Proposed SOP",
  approved_sop: "Approved SOP",
  superseded_sop: "Superseded SOP"
};

const statusStyles: Record<KnowledgeItem["status"], string> = {
  draft: "bg-surface-muted text-ink-500",
  pending_review: "bg-status-attentionBg text-status-attention",
  approved: "bg-status-safeBg text-status-safe",
  superseded: "bg-surface-muted text-ink-400"
};

export default function KnowledgePage() {
  const items = listKnowledgeItems();
  const decisions = listDecisions();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Knowledge</h1>
        <p className="text-sm text-ink-500">
          Owner and team operating knowledge, captured and turned into SOP candidates. No SOP change is ever silent —
          every proposal requires human review.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardBody className="space-y-2 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-surface-muted text-ink-700">{typeLabels[item.type]}</Badge>
                  <Badge className={statusStyles[item.status]}>{item.status.replace("_", " ")}</Badge>
                </div>
              </div>
              <p className="text-sm text-ink-700">{item.content}</p>
              {item.status === "pending_review" ? (
                <Link href="/approvals" className="text-xs font-medium text-brand-700 hover:underline">
                  Review in Approval Centre →
                </Link>
              ) : null}
              {item.approvedBy ? (
                <p className="text-xs text-ink-400">
                  v{item.version} · approved {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : ""}
                </p>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Decisions & outcomes</h2>
          <p className="text-sm text-ink-500">
            Institutional memory of approved/rejected consequential decisions. Outcomes are never invented — every
            decision starts unmeasured until this build has a real source of observed results to measure against.
          </p>
        </div>
        {decisions.length ? (
          <div className="space-y-3">
            {decisions.map((decision) => {
              return (
                <Card key={decision.id}>
                  <CardBody className="space-y-1.5 pt-4">
                    <p className="text-sm font-semibold text-ink-900">{decision.title}</p>
                    <p className="text-xs text-ink-500">{decision.rationale}</p>
                    <p className="text-xs text-ink-400">Expected: {decision.expectedOutcome}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="bg-surface-muted text-ink-500">Pending measurement</Badge>
                      <span className="text-xs text-ink-400">
                        Decided {new Date(decision.decidedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No decisions recorded yet."
            hint="Approve or reject a proposal in the Approval Centre to see it here."
          />
        )}
      </section>
    </div>
  );
}
