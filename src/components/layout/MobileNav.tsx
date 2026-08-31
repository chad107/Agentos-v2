import Link from "next/link";
import { NavLink } from "./NavLink";
import { MOBILE_NAV } from "./nav-items";

export function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-surface/95 px-1 py-1 backdrop-blur lg:hidden"
    >
      {MOBILE_NAV.map((item) => (
        <NavLink key={item.href} item={item} variant="mobile" />
      ))}
      <Link href="/activity" className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium text-ink-400">
        <span aria-hidden className="text-lg leading-none">
          ⋯
        </span>
        More
      </Link>
    </nav>
  );
}
