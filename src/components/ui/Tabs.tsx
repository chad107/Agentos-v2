"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
}

export function Tabs({ items, initialKey }: { items: TabItem[]; initialKey?: string }) {
  const [active, setActive] = useState(initialKey ?? items[0]?.key);
  const activeItem = items.find((i) => i.key === active) ?? items[0];

  return (
    <div>
      <div role="tablist" aria-label="Filter" className="flex gap-1 overflow-x-auto no-scrollbar border-b border-surface-border">
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={item.key === active}
            onClick={() => setActive(item.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              item.key === active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-700"
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  item.key === active ? "bg-brand-100 text-brand-700" : "bg-surface-muted text-ink-500"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="pt-4">{activeItem?.content}</div>
    </div>
  );
}
