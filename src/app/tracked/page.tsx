import Link from "next/link";
import { trackedItems, trackedCounts, TRACKED_CATEGORY_ICONS, type TrackedCategory } from "@/repositories/tracked";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const FILTERS: { key: TrackedCategory | "all"; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "waiting", label: "Waiting" },
  { key: "missing_info", label: "Missing information" },
  { key: "unassigned", label: "Unassigned" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All" }
];

export default function TrackedItemsPage({ searchParams }: { searchParams?: { filter?: string } }) {
  const items = trackedItems();
  const counts = trackedCounts(items);
  const activeFilter = (searchParams?.filter as TrackedCategory | "all" | undefined) ?? "all";
  const visible = activeFilter === "all" ? items : items.filter((i) => i.category === activeFilter);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Nothing Left Behind</h1>
        <p className="text-sm text-ink-500">
          Everything that still needs eventual attention but isn&apos;t in Cohen&apos;s Top 3 right now. Nothing lower-ranked
          disappears — it&apos;s all tracked here.
        </p>
      </div>

      <div role="tablist" aria-label="Filter" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? counts.total : counts[f.key as keyof typeof counts];
          const active = f.key === activeFilter;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/tracked" : `/tracked?filter=${f.key}`}
              role="tab"
              aria-selected={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-surface-border text-ink-500 hover:text-ink-700"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-brand-100 text-brand-700" : "bg-surface-muted text-ink-500"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {visible.length ? (
        <div className="space-y-2">
          {visible.map((item) => (
            <Link key={item.id} href={item.href} className="block">
              <Card className="transition-colors hover:border-brand-200">
                <CardBody className="flex items-start justify-between gap-3 pt-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                      <span aria-hidden>{TRACKED_CATEGORY_ICONS[item.category]}</span>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.detail}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-ink-400">
                    <p>{item.area}</p>
                    {item.dueAt ? <p>{new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p> : null}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing matches this filter." hint="Try a different category, or view All." />
      )}
    </div>
  );
}
