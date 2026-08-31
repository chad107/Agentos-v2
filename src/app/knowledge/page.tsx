import Link from "next/link";
import { listKnowledgeItems } from "@/repositories";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
    </div>
  );
}
