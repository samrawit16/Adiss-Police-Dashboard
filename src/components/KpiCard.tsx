import Link from "next/link";

const PALETTES = {
  cream: "bg-[#FFB900] text-slate-900",
  blue: "bg-[#244A96] text-white",
  sky: "bg-[#4E74D8] text-white",
  red: "bg-red-600 text-white",
  green: "bg-emerald-600 text-white",
} as const;

export default function KpiCard({ label, value, hint, palette = "cream", href }: {
  label: string; value: string | number; hint?: string; palette?: keyof typeof PALETTES; href?: string;
}) {
  const body = (
    <div className={`rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${PALETTES[palette]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs mt-1 opacity-75">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
