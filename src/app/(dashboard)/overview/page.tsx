"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import KpiCard from "@/components/KpiCard";
import BarChart from "@/components/BarChart";
import DonutChart from "@/components/DonutChart";
import StatusBadge from "@/components/StatusBadge";
import SeverityPill from "@/components/SeverityPill";
import { api } from "@/lib/api";
import { buildTrend } from "@/lib/trend";
import { roadHotspots, withinDays } from "@/lib/insights";
import { placeLabel, timeAgo, typeLabel } from "@/lib/format";
import type { AccidentReport, AdminStats } from "@/lib/types";

export default function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AccidentReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(e.message));
    api.reports().then(setReports).catch((e) => { setReports([]); setError(e.message); });
  }, []);

  const trend = useMemo(() => buildTrend(reports ?? []), [reports]);
  const roads = useMemo(() => roadHotspots(withinDays(reports ?? [], 90)).slice(0, 6), [reports]);
  const maxScore = roads[0]?.score ?? 1;
  const oldestWaiting = useMemo(() => {
    const waiting = (reports ?? []).filter((r) => r.status === "submitted");
    return waiting.length ? waiting.reduce((a, b) => (a.created_at < b.created_at ? a : b)) : null;
  }, [reports]);

  const s = stats ?? { total_reports: 0, submitted: 0, under_review: 0, resolved: 0, rejected: 0, emergency_reports: 0, open_emergencies: 0, injury_reports: 0 };
  const recent = (reports ?? []).slice(0, 6);
  const closed = s.resolved + s.rejected;

  return (
    <div className="pb-12">
      <TopBar title="Overview" subtitle="Live command view of road safety operations" />
      {error && (
        <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
          Could not load some data: {error}
        </div>
      )}
      <div className="px-6 lg:px-10 mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Reports" value={s.total_reports} hint={`${s.injury_reports} with injuries reported`} palette="blue" href="/reports" />
          <KpiCard label="Awaiting Action" value={s.submitted}
            hint={oldestWaiting ? `Oldest waiting ${timeAgo(oldestWaiting.created_at).replace(" ago", "")}` : "Nothing waiting"}
            palette="cream" href="/reports?status=submitted" />
          <KpiCard label="Open Emergencies" value={s.open_emergencies}
            hint={`${s.emergency_reports} emergency reports in total`}
            palette={s.open_emergencies > 0 ? "red" : "green"} href="/reports?emergency=1" />
          <KpiCard label="Cases Closed" value={closed}
            hint={`${s.resolved} resolved · ${s.rejected} rejected (${Math.round((closed / (s.total_reports || 1)) * 100)}%)`}
            palette="sky" href="/reports?status=resolved" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Reports per Month</h3>
              <span className="text-xs text-slate-400">Last 7 months · by severity · Addis time</span>
            </div>
            <BarChart data={trend} />
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Case Pipeline</h3>
              <span className="text-xs text-slate-400">All time</span>
            </div>
            <DonutChart
              segments={[
                { label: "Submitted", value: s.submitted },
                { label: "Under review", value: s.under_review },
                { label: "Resolved", value: s.resolved },
                { label: "Rejected", value: s.rejected },
              ]}
              centerValue={s.total_reports}
              centerLabel="CASES"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Latest Reports</h3>
              <Link href="/reports" className="text-xs font-semibold text-blue-700 hover:underline">View all →</Link>
            </div>
            <div className="divide-y">
              {recent.map((r) => (
                <Link key={r.id} href={`/reports?open=${r.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                  <div className={`h-9 w-9 rounded-full grid place-items-center text-white text-xs font-bold shrink-0 ${r.emergency_required ? "bg-red-500" : "bg-[#173B82]"}`}>
                    {r.emergency_required ? "!" : r.user_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">#{r.id} · {typeLabel(r.report_type)}</div>
                    <div className="text-xs text-slate-500 truncate">{placeLabel(r)} · {timeAgo(r.created_at)}</div>
                  </div>
                  <SeverityPill severity={r.severity} />
                  <StatusBadge status={r.status} />
                </Link>
              ))}
              {reports === null && <div className="py-8 text-center text-sm text-slate-400">Loading reports…</div>}
              {reports !== null && recent.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No reports have been submitted yet.</div>}
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Busiest Roads</h3>
            <p className="text-xs text-slate-400 mb-4">Last 90 days · weighted by severity</p>
            <div className="space-y-4">
              {roads.map((r) => (
                <div key={r.road}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{r.road}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{r.total} report{r.total === 1 ? "" : "s"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#244A96]" style={{ width: `${(r.score / maxScore) * 100}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{r.critical} critical · {r.serious} serious · {r.emergencies} emergency</div>
                </div>
              ))}
              {reports !== null && roads.length === 0 && <div className="text-sm text-slate-400 py-2">No reports in the last 90 days.</div>}
            </div>
            <Link href="/map" className="mt-5 inline-flex text-xs font-semibold text-blue-700 hover:underline">Open hotspot map →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
