import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TRACKED_CATEGORY_ICONS, TRACKED_CATEGORY_LABELS, type TrackedCounts } from "@/repositories/tracked";

const SUMMARY_ORDER: (keyof Omit<TrackedCounts, "total" | "upcoming">)[] = [
  "overdue",
  "waiting",
  "missing_info",
  "unassigned"
];

/**
 * Home summary for "Nothing Left Behind" — a trust mechanism as much as a
 * worklist. Cohen decides what deserves the Top 3; this lets a human
 * independently verify that everything else is still tracked, not dropped.
 */
export function NothingLeftBehind({ counts }: { counts: TrackedCounts }) {
  if (counts.total === 0) {
    return (
      <Card>
        <CardBody className="pt-4">
          <p className="text-sm font-medium text-ink-900">Nothing left behind</p>
          <p className="mt-0.5 text-sm text-ink-500">Everything outside the Top 3 is current — nothing is sitting unattended.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Link href="/tracked" className="block">
      <Card className="transition-colors hover:border-brand-200">
        <CardHeader className="pb-0">
          <p className="text-sm font-semibold text-ink-900">Nothing Left Behind — {counts.total}</p>
        </CardHeader>
        <CardBody className="space-y-1.5 pt-2">
          {SUMMARY_ORDER.filter((key) => counts[key] > 0).map((key) => (
            <p key={key} className="flex items-center gap-1.5 text-sm text-ink-700">
              <span aria-hidden>{TRACKED_CATEGORY_ICONS[key]}</span>
              {counts[key]} {TRACKED_CATEGORY_LABELS[key].toLowerCase()}
            </p>
          ))}
          <p className="pt-1 text-sm font-medium text-brand-700">View all tracked items →</p>
        </CardBody>
      </Card>
    </Link>
  );
}
