import { AskCohenTopBarButton } from "@/components/cohen/AskCohenLauncher";

export function TopBar({ urgentCount, pendingCount }: { urgentCount: number; pendingCount: number }) {
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">Valley River Heat Pumps</p>
        <p className="truncate text-xs text-ink-400">{today}</p>
      </div>

      <label className="relative hidden max-w-xs flex-1 md:block">
        <span className="sr-only">Search customer, job, quote, vendor or agent</span>
        <input
          type="search"
          placeholder="Search customer, job, quote, vendor…"
          className="w-full rounded-lg border border-surface-border bg-surface-subtle px-3 py-1.5 text-sm placeholder:text-ink-400 focus:border-brand-500"
        />
      </label>

      <AskCohenTopBarButton />

      <a
        href="/activity"
        aria-label={`Notifications: ${urgentCount} urgent, ${pendingCount} pending approvals`}
        className="relative rounded-lg p-2 text-ink-500 hover:bg-surface-muted"
      >
        <span aria-hidden className="text-lg">
          🔔
        </span>
        {urgentCount + pendingCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-urgent px-1 text-[10px] font-semibold text-white">
            {urgentCount + pendingCount}
          </span>
        ) : null}
      </a>

      <button
        className="hidden items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-sm text-ink-700 sm:flex"
        title="Multi-business support is planned for a future release"
        disabled
      >
        Valley River Heat Pumps <span aria-hidden>▾</span>
      </button>
    </header>
  );
}
