"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavItem } from "./nav-items";

export function NavLink({ item, variant = "sidebar" }: { item: NavItem; variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

  if (variant === "mobile") {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium",
          active ? "text-brand-700" : "text-ink-400"
        )}
      >
        <span aria-hidden className="text-lg leading-none">
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-surface-muted hover:text-ink-900"
      )}
    >
      <span aria-hidden className="w-4 text-center text-base leading-none">
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}
