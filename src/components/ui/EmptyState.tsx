/**
 * Empty states use specific, reassuring language rather than a generic
 * "No data" (11_UI_COPY_AND_STATES.md "Empty states").
 */
import type { ReactNode } from "react";

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-surface-border bg-surface-subtle px-6 py-10 text-center">
      {icon}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-ink-400">{hint}</p> : null}
    </div>
  );
}
