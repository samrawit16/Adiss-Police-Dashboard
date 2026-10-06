"use client";

export interface BarDatum {
  month: string;
  critical: number;
  serious: number;
  minor: number;
  unknown: number;
}

const COLORS = { minor: "#4E74D8", serious: "#ea580c", critical: "#dc2626", unknown: "#cbd5e1" } as const;
const KEYS: (keyof typeof COLORS)[] = ["minor", "serious", "critical", "unknown"];

export default function BarChart({ data }: { data: BarDatum[] }) {
  const totals = data.map((d) => KEYS.reduce((s, k) => s + d[k], 0));
  const max = Math.max(1, ...totals);
  return (
    <div>
      <div className="flex items-end gap-4 h-56 px-1">
        {data.map((d, i) => (
          <div key={d.month + i} className="flex-1 h-full flex flex-col items-center gap-2 group">
            <div className="relative w-full max-w-[38px] h-full flex flex-col-reverse rounded-lg overflow-hidden bg-slate-50">
              {KEYS.map((k) => (
                <div key={k} className="w-full transition-all" style={{ height: `${(d[k] / max) * 100}%`, background: COLORS[k] }} title={`${k}: ${d[k]}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">{totals[i]}</span>
            <span className="text-xs text-slate-500 -mt-1.5">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        {KEYS.map((k) => (
          <span key={k} className="flex items-center gap-1.5 capitalize">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[k] }} /> {k}
          </span>
        ))}
      </div>
    </div>
  );
}
