export interface Kpi {
  label: string;
  value: string | number;
}

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((kpi) => (
        <div key={kpi.label} className="rounded-card border border-surface-border bg-surface px-3 py-2.5 shadow-card">
          <p className="text-xl font-bold text-ink-900">{kpi.value}</p>
          <p className="text-xs text-ink-500">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}
