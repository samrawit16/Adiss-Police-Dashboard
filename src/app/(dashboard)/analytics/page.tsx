"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import BarChart from "@/components/BarChart";
import KpiCard from "@/components/KpiCard";
import SeverityPill from "@/components/SeverityPill";
import { api } from "@/lib/api";
import { buildTrend } from "@/lib/trend";
import { byHour, byWeekday, countBy, isCollision, withinDays } from "@/lib/insights";
import { eventLabel, timeAgo, typeLabel } from "@/lib/format";
import type { AccidentReport, Hotspot, SafetyEvent } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Bars({ values, labels, highlight }: { values: number[]; labels: string[]; highlight?: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1.5 h-40">
      {values.map((v, i) => (
        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1" title={`${labels[i]}: ${v}`}>
          <div className="w-full rounded-t-md" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0, background: highlight?.includes(i) ? "#ea580c" : "#4E74D8" }} />
          <span className="text-[10px] text-slate-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function RankList({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <div className="space-y-3">
      {rows.map(([label, n]) => (
        <div key={label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{label}</span>
            <span className="text-slate-500 tabular-nums">{n}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#4E74D8]" style={{ width: `${(n / max) * 100}%` }} /></div>
        </div>
      ))}
      {rows.length === 0 && <div className="text-sm text-slate-400">No data yet.</div>}
    </div>
  );
}

export default function Analytics() {
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [profiles, setProfiles] = useState<Hotspot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reports().then(setReports).catch((e) => setError(e.message));
    api.events(30).then(setEvents).catch((e) => setError(e.message));
    api.hotspots().then(setProfiles).catch(() => {});
  }, []);

  const recent = useMemo(() => withinDays(reports, 90), [reports]);
  const collisions = useMemo(() => recent.filter(isCollision), [recent]);
  const hours = useMemo(() => byHour(collisions), [collisions]);
  const weekdays = useMemo(() => byWeekday(collisions), [collisions]);
  const peakHours = useMemo(() => {
    const top = [...hours.keys()].sort((a, b) => hours[b] - hours[a]).slice(0, 3);
    return top;
  }, [hours]);
  const trend = useMemo(() => buildTrend(reports), [reports]);

  const overspeed = useMemo(() => events.filter((e) => e.speed_kmh != null && e.speed_limit_kmh != null && e.speed_kmh > e.speed_limit_kmh), [events]);
  const phoneUse = events.filter((e) => e.phone_use || e.event_type === "phone_use_near_traffic").length;
  const speedRoads = useMemo(() => countBy(overspeed, (e) => e.road_name ?? "Unnamed road").slice(0, 6), [overspeed]);
  const profileRows = useMemo(() => profiles.slice().sort((a, b) => b.risk_score - a.risk_score).slice(0, 8), [profiles]);

  return (
    <div className="pb-12">
      <TopBar title="Analytics" subtitle="Incident patterns and road-user behaviour" />
      {error && <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">Could not load some data: {error}</div>}
      <div className="px-6 lg:px-10 mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Collisions (90 days)" value={collisions.length} hint="Road accidents and hit-and-run" palette="blue" />
          <KpiCard label="Behaviour Events (30 days)" value={events.length} palette="cream" />
          <KpiCard label="Above Speed Limit" value={overspeed.length} hint="Reading over the posted limit" palette="red" />
          <KpiCard label="Phone Use Near Traffic" value={phoneUse} palette="sky" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Collisions by Hour of Day</h3>
              <span className="text-xs text-slate-400">Last 90 days · Addis time</span>
            </div>
            <Bars values={hours} labels={hours.map((_, h) => (h % 3 === 0 ? String(h).padStart(2, "0") : ""))} highlight={peakHours} />
            <p className="text-xs text-slate-500 mt-3">
              Busiest hours: {peakHours.filter((h) => hours[h] > 0).map((h) => `${String(h).padStart(2, "0")}:00`).join(", ") || "—"}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Collisions by Weekday</h3>
              <span className="text-xs text-slate-400">Last 90 days</span>
            </div>
            <Bars values={weekdays} labels={WEEKDAYS} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="card-title mb-4">Reports by Type <span className="text-xs font-normal text-slate-400">(90 days)</span></h3>
            <RankList rows={countBy(recent, (r) => typeLabel(r.report_type))} />
          </div>
          <div className="card">
            <h3 className="card-title mb-4">Behaviour Events by Type <span className="text-xs font-normal text-slate-400">(30 days)</span></h3>
            <RankList rows={countBy(events, (e) => eventLabel(e.event_type))} />
          </div>
          <div className="card">
            <h3 className="card-title mb-4">Roads With Most Speeding <span className="text-xs font-normal text-slate-400">(30 days)</span></h3>
            <RankList rows={speedRoads} />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Reports per Month</h3>
          <BarChart data={trend} />
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b"><h3 className="card-title">Recent Behaviour Events</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>{["User", "Event", "Activity", "Speed", "Limit", "Road", "When"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {events.slice(0, 12).map((e) => {
                  const over = e.speed_kmh != null && e.speed_limit_kmh != null && e.speed_kmh > e.speed_limit_kmh;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{e.user_name}{e.is_demo && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">SAMPLE</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{eventLabel(e.event_type)}{e.phone_use && <span className="ml-1" title="Phone in use">📱</span>}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{e.activity}</td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${over ? "text-red-500" : ""}`}>{e.speed_kmh != null ? `${Math.round(e.speed_kmh)} km/h` : "—"}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">{e.speed_limit_kmh != null ? `${Math.round(e.speed_limit_kmh)} km/h` : "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{e.road_name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{timeAgo(e.created_at)}</td>
                    </tr>
                  );
                })}
                {events.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No behaviour events in the last 30 days.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b">
            <h3 className="card-title">Historical Risk Profiles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Built from the Addis Ababa RTA dataset. Grouped by land use and junction type, so they describe what kind of place is risky, not which place.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>{["Area type", "Junction", "Accidents", "Fatal", "Serious", "Risk score", "Peak hour", "Level"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {profileRows.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{h.area}</td>
                    <td className="px-4 py-3 text-slate-600">{h.junction_type}</td>
                    <td className="px-4 py-3 tabular-nums">{h.accidents}</td>
                    <td className="px-4 py-3 tabular-nums">{h.fatalities}</td>
                    <td className="px-4 py-3 tabular-nums">{h.injuries}</td>
                    <td className="px-4 py-3 tabular-nums">{Number(h.risk_score).toFixed(0)}</td>
                    <td className="px-4 py-3 tabular-nums">{String(h.peak_hour).padStart(2, "0")}:00</td>
                    <td className="px-4 py-3"><SeverityPill severity={h.severity} /></td>
                  </tr>
                ))}
                {profileRows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No risk profiles loaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
