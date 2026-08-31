import Link from "next/link";
import type { NeedsAttentionRow } from "@/repositories/home";

/**
 * Compact, severity-ordered "Needs Attention" list. Only areas that
 * actually need something are shown — a clean area contributes nothing
 * here (it's reflected instead as a small green status in Business
 * Health). Each row is clickable (V2 spec, "Needs Attention").
 */
export function NeedsAttention({ rows, total }: { rows: NeedsAttentionRow[]; total: number }) {
  if (!rows.length) {
    return (
      <div className="rounded-card border border-surface-border bg-surface px-4 py-3 shadow-card">
        <p className="text-sm font-medium text-ink-900">Needs attention — 0</p>
        <p className="mt-0.5 text-sm text-ink-500">Nothing needs you right now.</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-surface-border bg-surface shadow-card">
      <p className="px-4 pt-3 text-sm font-semibold text-ink-900">Needs attention — {total}</p>
      <ul className="divide-y divide-surface-border">
        {rows.map((row) => (
          <li key={row.key}>
            <Link href={row.href} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-muted">
              <span aria-hidden>{row.icon}</span>
              <span className="font-medium text-ink-900">{row.area}</span>
              <span className="text-ink-500">— {row.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
