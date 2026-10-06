"use client";

const COLORS = ["#244A96", "#4E74D8", "#FFB900", "#173B82", "#e2e8f0"];

export default function DonutChart({ segments, centerLabel, centerValue }: {
  segments: { label: string; value: number }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f6" strokeWidth="16" />
          {segments.map((s, i) => {
            const dash = (s.value / total) * C;
            const el = (
              <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="16"
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-bold">{centerValue}</div>
            <div className="text-[11px] text-slate-500">{centerLabel}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {s.label} <span className="font-semibold text-slate-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
