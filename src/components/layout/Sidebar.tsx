import { NavLink } from "./NavLink";
import { PRIMARY_NAV, SETTINGS_NAV } from "./nav-items";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-surface-border bg-surface px-3 py-5 lg:flex">
      <div className="px-2">
        <p className="text-sm font-semibold text-ink-900">AgentOS</p>
        <p className="text-xs text-ink-400">Valley River Heat Pumps</p>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="border-t border-surface-border pt-3">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Settings</p>
        <nav aria-label="Settings" className="flex flex-col gap-0.5">
          {SETTINGS_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
