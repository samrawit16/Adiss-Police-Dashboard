"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import SeverityPill from "@/components/SeverityPill";
import { api } from "@/lib/api";
import { fmtDateTime, placeLabel, timeAgo, typeLabel, TYPE_LABEL } from "@/lib/format";
import type { AccidentReport, ReportStatus } from "@/lib/types";

const STATUSES: (ReportStatus | "all")[] = ["all", "submitted", "under_review", "resolved", "rejected"];
const PAGE = 15;

export default function ReportsPage() {
  // useSearchParams needs a Suspense boundary for the production build.
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-400">Loading…</div>}>
      <Reports />
    </Suspense>
  );
}

function Reports() {
  const params = useSearchParams();
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [status, setStatus] = useState<string>(params.get("status") ?? "all");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [emergencyOnly, setEmergencyOnly] = useState(params.get("emergency") === "1");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(params.get("open") ? Number(params.get("open")) : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.reports().then(setReports).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // Navigating here from the top bar search / overview links while already on this page.
  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setStatus(params.get("status") ?? "all");
    setEmergencyOnly(params.get("emergency") === "1");
    const open = params.get("open");
    if (open) setSelectedId(Number(open));
    setPage(0);
  }, [params]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reports.length };
    reports.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return reports.filter((r) =>
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      (type === "all" || r.report_type === type) &&
      (!emergencyOnly || r.emergency_required) &&
      (q === "" || String(r.id) === q || r.user_name.toLowerCase().includes(q) ||
        (r.road_name ?? "").toLowerCase().includes(q) || r.user_phone.includes(q))
    );
  }, [reports, status, severity, type, emergencyOnly, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const changeStatus = async (r: AccidentReport, s: ReportStatus) => {
    setBusy(true); setActionError(null);
    try {
      const updated = await api.updateReportStatus(r.id, s);
      setReports((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: updated.status } : x)));
    } catch (e: any) {
      setActionError(e.message ?? "Could not update the report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-12">
      <TopBar title="Accident Reports" subtitle="Citizen-submitted cases awaiting review" />
      {error && <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">Could not load reports: {error}</div>}
      <div className="px-6 lg:px-10 mt-6">
        <div className="card p-4 flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {STATUSES.map((st) => (
              <button key={st} onClick={() => { setStatus(st); setPage(0); }}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition ${status === st ? "bg-[#173B82] text-white shadow" : "text-slate-600 hover:bg-white"}`}>
                {st === "all" ? "All" : st.replace("_", " ")}
                <span className={`ml-1.5 text-xs ${status === st ? "text-sky-200" : "text-slate-400"}`}>{counts[st] ?? 0}</span>
              </button>
            ))}
          </div>
          <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(0); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">Any severity</option>
            {["critical", "serious", "minor", "unknown"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">Any type</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={emergencyOnly} onChange={(e) => { setEmergencyOnly(e.target.checked); setPage(0); }} className="h-4 w-4 accent-red-600" />
            Emergency only
          </label>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="ml-auto rounded-xl border border-slate-200 px-4 py-2 text-sm w-64"
            placeholder="Search ID, reporter, phone or road…" />
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["ID", "Reporter", "Type", "Road", "Severity", "Emergency", "Reported", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50 cursor-pointer ${r.emergency_required && (r.status === "submitted" || r.status === "under_review") ? "bg-red-50/40" : ""}`} onClick={() => { setSelectedId(r.id); setActionError(null); }}>
                    <td className="px-4 py-3 font-semibold text-slate-900">#{r.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.user_name}{r.is_demo && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">SAMPLE</span>}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{typeLabel(r.report_type)}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[16rem] truncate" title={placeLabel(r)}>{placeLabel(r)}</td>
                    <td className="px-4 py-3"><SeverityPill severity={r.severity} /></td>
                    <td className="px-4 py-3">{r.emergency_required ? <span className="text-red-500 font-semibold">⚠ Yes</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={fmtDateTime(r.created_at)}>{timeAgo(r.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-slate-400">›</td>
                  </tr>
                ))}
                {loading && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading reports…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">No reports match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
            <span>{filtered.length} report{filtered.length === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-lg px-3 py-1.5 bg-slate-100 disabled:opacity-40">← Prev</button>
              <span>Page {safePage + 1} of {pages}</span>
              <button disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="rounded-lg px-3 py-1.5 bg-slate-100 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-6 py-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Report #{selected.id}</h3>
              <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-700 text-xl" aria-label="Close">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm">
              {selected.emergency_required && (selected.status === "submitted" || selected.status === "under_review") && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 font-medium">⚠ Emergency response was requested for this report.</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[["Reporter", selected.user_name], ["Phone", selected.user_phone], ["Email", selected.user_email],
                  ["Type", typeLabel(selected.report_type)], ["Road / place", placeLabel(selected)],
                  ["Occurred", fmtDateTime(selected.occurred_at)], ["Reported", fmtDateTime(selected.created_at)]].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <div className="text-xs text-slate-400 uppercase">{k}</div>
                    <div className="font-medium break-words">{k === "Phone" ? <a className="text-blue-700 hover:underline" href={`tel:${v}`}>{v}</a> : v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase mb-1">Description</div>
                <p className="bg-slate-50 rounded-xl p-3">{selected.description ?? "No description provided."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-slate-400 uppercase mb-1">Severity</div><SeverityPill severity={selected.severity} /></div>
                <div><div className="text-xs text-slate-400 uppercase mb-1">Status</div><StatusBadge status={selected.status} /></div>
                <div><div className="text-xs text-slate-400 uppercase">Injuries</div>{selected.injuries_reported ? "Yes" : "No"}</div>
                <div><div className="text-xs text-slate-400 uppercase">GPS accuracy</div>{selected.gps_accuracy_m ? `±${Math.round(selected.gps_accuracy_m)} m` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase mb-1">Location</div>
                <a className="text-blue-700 hover:underline" target="_blank" rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} — open in OpenStreetMap ↗
                </a>
              </div>
              {selected.evidence_urls.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 uppercase mb-2">Evidence ({selected.evidence_urls.length})</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.evidence_urls.map((u) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="Evidence" className="rounded-xl border w-full h-32 object-cover bg-slate-100" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <div className="text-xs text-slate-400 uppercase mb-2">Actions</div>
                <div className="flex flex-wrap gap-2">
                  {(["under_review", "resolved", "rejected"] as ReportStatus[]).map((s) => (
                    <button key={s} disabled={busy || selected.status === s} onClick={() => changeStatus(selected, s)}
                      className="rounded-xl bg-[#173B82] px-4 py-2 text-sm font-medium text-white hover:bg-[#244A96] disabled:opacity-40 capitalize">
                      Mark {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
                {actionError && <div className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{actionError}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
