const STYLES: Record<string, string> = {
  submitted: "bg-sky-100 text-sky-700",
  under_review: "bg-amber-100 text-amber-700",
  resolved: "bg-lime-100 text-lime-700",
  rejected: "bg-rose-100 text-rose-700",
};

const LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  resolved: "Resolved",
  rejected: "Rejected",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>{LABELS[status] ?? status}</span>;
}
