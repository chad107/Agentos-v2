import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export interface DeadlineItem {
  id: string;
  label: string;
  dueAt: string;
  category: string;
  href: string;
}

export function UpcomingDeadlines({ items }: { items: DeadlineItem[] }) {
  if (!items.length) {
    return <EmptyState title="Nothing is due in the next 7 days." />;
  }
  return (
    <ul className="divide-y divide-surface-border">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={item.href} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-700">
            <span className="min-w-0 truncate text-ink-900">{item.label}</span>
            <span className="shrink-0 text-xs text-ink-500">
              {item.category} · {new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
