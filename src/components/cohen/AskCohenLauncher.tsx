"use client";

import { useAskCohen } from "./ask-cohen-context";

/**
 * Global floating entry point (03_DASHBOARD_UX_SPEC.md "Global UI"). Per
 * the V2 spec ("Improve Ask Cohen"), this stays persistent but must never
 * cover content or buttons — on mobile it collapses to a small icon-only
 * circle that expands into the full panel on tap, and sits well clear of
 * the bottom nav bar.
 */
export function AskCohenLauncher() {
  const { openPanel } = useAskCohen();
  return (
    <button
      onClick={() => openPanel(null)}
      aria-label="Ask Cohen"
      className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg text-white shadow-popover hover:bg-brand-700 lg:bottom-6 lg:right-6 lg:h-auto lg:w-auto lg:gap-2 lg:rounded-full lg:px-4 lg:py-3 lg:text-sm lg:font-medium"
    >
      <span aria-hidden>💬</span>
      <span className="hidden lg:inline">Ask Cohen</span>
    </button>
  );
}

export function AskCohenTopBarButton() {
  const { openPanel } = useAskCohen();
  return (
    <button
      onClick={() => openPanel(null)}
      className="hidden items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-ink-500 hover:bg-surface-muted sm:flex"
    >
      <span aria-hidden>💬</span>
      Ask Cohen
    </button>
  );
}
