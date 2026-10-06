// Handles both vocabularies in the backend: citizen reports (minor/serious/critical/unknown)
// and historical risk profiles (medium/high/critical).
const SEV: Record<string, string> = {
  minor: "bg-blue-100 text-blue-700",
  serious: "bg-orange-100 text-orange-700",
  critical: "bg-red-500 text-white",
  unknown: "bg-slate-100 text-slate-500",
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
};

export default function SeverityPill({ severity }: { severity: string | null }) {
  if (!severity) return <span className="text-slate-400 text-xs">—</span>;
  const s = severity.toLowerCase();
  return <span className={`badge ${SEV[s] ?? "bg-slate-100 text-slate-600"}`}>{s.toUpperCase()}</span>;
}
