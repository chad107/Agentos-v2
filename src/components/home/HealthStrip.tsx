import Link from "next/link";
import type { HealthIndicator } from "@/core";

/**
 * Exception-driven Business Health (V2 spec, "Make Business Health
 * exception-driven"): a healthy area earns one small green line, not a
 * card the same size as a real problem. Areas with something wrong expand
 * into a fuller, more visually prominent row so problems are never lost
 * among zero-condition noise.
 */
export function HealthStrip({ health }: { health: HealthIndicator[] }) {
  const problems = health.filter((h) => h.status !== "good");
  const healthy = health.filter((h) => h.status === "good");

  return (
    <div className="space-y-2">
      {problems.length ? (
        <div className="space-y-1.5">
          {problems.map((h) => (
            <Link
              key={h.area}
              href={h.href}
              className={`flex items-center gap-2 rounded-card border px-3 py-2.5 text-sm shadow-card transition-colors hover:border-brand-200 ${
                h.status === "urgent" ? "border-status-urgent/30 bg-status-urgentBg" : "border-status-attention/30 bg-status-attentionBg"
              }`}
            >
              <span aria-hidden>{h.status === "urgent" ? "🔴" : "🟠"}</span>
              <span className="font-semibold text-ink-900">{h.area}</span>
              <span className={h.status === "urgent" ? "text-status-urgent" : "text-status-attention"}>{h.label}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {healthy.length ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-ink-500">
          {healthy.map((h) => (
            <Link key={h.area} href={h.href} className="flex items-center gap-1 hover:text-ink-700">
              <span aria-hidden className="text-status-safe">●</span>
              {h.area}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
