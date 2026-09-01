import Link from "next/link";
import { unifiedWorkQueue, DIVISIONS } from "@/core";
import type { WorkItem } from "@/domain/platform";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const priorityStyles: Record<WorkItem["priority"], string> = {
  urgent: "bg-status-urgentBg text-status-urgent",
  high: "bg-status-attentionBg text-status-attention",
  normal: "bg-status-infoBg text-status-info",
  low: "bg-surface-muted text-ink-500"
};

function WorkItemList({ items }: { items: WorkItem[] }) {
  if (!items.length) return <EmptyState title="Nothing in this queue right now." />;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link key={item.id} href={item.href}>
          <Card className="transition-colors hover:border-brand-300">
            <CardBody className="flex flex-wrap items-start justify-between gap-2 pt-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink-900">{item.title}</p>
                  <Badge className={priorityStyles[item.priority]}>{item.priority}</Badge>
                  <Badge className="bg-surface-muted text-ink-500">{item.kind === "approval" ? "Approval" : "Tracked"}</Badge>
                </div>
                <p className="text-xs text-ink-500">{item.detail}</p>
              </div>
              {item.dueAt ? (
                <p className="shrink-0 text-xs text-ink-400">{new Date(item.dueAt).toLocaleString()}</p>
              ) : null}
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * Unified cross-division Work Queue (01_MASTER_SPEC.md). Merges open
 * Approval Centre proposals and "Nothing Left Behind" tracked items so
 * nothing needs to be checked in two places to see everything open for a
 * division. The Approval Centre (/approvals) and Nothing Left Behind
 * (/tracked) remain the deeper, type-specific views.
 */
export default function WorkQueuePage() {
  const items = unifiedWorkQueue();

  const tabs: TabItem[] = [
    { key: "all", label: "All", count: items.length, content: <WorkItemList items={items} /> },
    ...DIVISIONS.map((d) => {
      const divisionItems = items.filter((i) => i.division === d.key);
      return {
        key: d.key,
        label: d.label,
        count: divisionItems.length,
        content: <WorkItemList items={divisionItems} />
      };
    })
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Work Queue</h1>
        <p className="text-sm text-ink-500">
          Every open approval and tracked item, in one cross-division list. Deep dive in{" "}
          <Link href="/approvals" className="font-medium text-brand-700 hover:underline">
            Approvals
          </Link>{" "}
          or{" "}
          <Link href="/tracked" className="font-medium text-brand-700 hover:underline">
            Nothing Left Behind
          </Link>
          .
        </p>
      </div>
      <Tabs items={tabs} initialKey="all" />
    </div>
  );
}
