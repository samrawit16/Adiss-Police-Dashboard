// Monthly report counts by severity, bucketed on when the incident happened (Addis time).
import type { BarDatum } from "@/components/BarChart";
import type { AccidentReport } from "./types";
import { addisParts } from "./format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function buildTrend(reports: AccidentReport[], months = 7): BarDatum[] {
  const now = new Date();
  const cur = addisParts(now.toISOString());
  const buckets: BarDatum[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const idx = (((cur.month - i) % 12) + 12) % 12;
    buckets.push({ month: MONTHS[idx], critical: 0, serious: 0, minor: 0, unknown: 0 });
  }
  for (const r of reports) {
    const p = addisParts(r.occurred_at);
    const diff = (cur.year - p.year) * 12 + (cur.month - p.month);
    const slot = months - 1 - diff;
    if (slot < 0 || slot >= months) continue;
    const key = (r.severity ?? "unknown") as keyof Omit<BarDatum, "month">;
    buckets[slot][key in buckets[slot] ? key : "unknown"] += 1;
  }
  return buckets;
}
