"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import SeverityPill from "@/components/SeverityPill";
import { api } from "@/lib/api";
import { clusterReports, withinDays } from "@/lib/insights";
import { SEV_COLOR, SEV_ORDER } from "@/lib/format";
import type { AccidentReport, Authority, Hotspot } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full grid place-items-center text-sm text-slate-400">Loading map…</div>,
});

export default function MapPage() {
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [profiles, setProfiles] = useState<Hotspot[]>([]);
  const [days, setDays] = useState(90);
  const [sev, setSev] = useState<Record<string, boolean>>({ critical: true, serious: true, minor: true, unknown: true });
  const [openOnly, setOpenOnly] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showDensity, setShowDensity] = useState(true);
  const [showAuthorities, setShowAuthorities] = useState(true);
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reports().then(setReports).catch((e) => setError(e.message));
    api.authorities().then(setAuthorities).catch(() => {});
    api.hotspots().then(setProfiles).catch(() => {});
  }, []);

  const visible = useMemo(
    () => withinDays(reports, days).filter((r) => sev[r.severity ?? "unknown"] && (!openOnly || r.status === "submitted" || r.status === "under_review")),
    [reports, days, sev, openOnly],
  );
  const clusters = useMemo(() => clusterReports(visible), [visible]);
  const topClusters = clusters.filter((c) => c.count > 1).slice(0, 8);
  const topProfiles = useMemo(() => profiles.slice().sort((a, b) => b.risk_score - a.risk_score).slice(0, 6), [profiles]);

  return (
    <div className="pb-12">
      <TopBar title="Hotspot Map" subtitle="Where reported incidents cluster across Addis Ababa" />
      {error && <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">Could not load reports: {error}</div>}
      <div className="px-6 lg:px-10 mt-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-3">
          <div className="card p-0 overflow-hidden" style={{ height: "68vh", minHeight: 420 }}>
            <MapView reports={visible} clusters={clusters} authorities={authorities}
              showReports={showReports} showDensity={showDensity} showAuthorities={showAuthorities} focus={focus} />
          </div>
          <div className="text-xs text-slate-500">
            Showing {visible.length} of {reports.length} reports. Circles group reports within about 500 m and are coloured by the worst severity inside.
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="card-title">Filters</h3>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-2">Period</div>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {[30, 90, 180, 365].map((d) => (
                  <button key={d} onClick={() => setDays(d)}
                    className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${days === d ? "bg-[#173B82] text-white" : "text-slate-600 hover:bg-white"}`}>
                    {d === 365 ? "1 y" : `${d} d`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-2">Severity</div>
              {SEV_ORDER.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm py-1 capitalize cursor-pointer">
                  <input type="checkbox" checked={sev[s]} onChange={(e) => setSev({ ...sev, [s]: e.target.checked })} className="h-4 w-4" style={{ accentColor: SEV_COLOR[s] }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: SEV_COLOR[s] }} /> {s}
                </label>
              ))}
            </div>
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span>Only cases not yet closed</span>
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4 accent-[#244A96]" />
            </label>
            <div className="border-t pt-3 space-y-2 text-sm">
              {([["Report points", showReports, setShowReports], ["Density circles", showDensity, setShowDensity], ["Police & emergency posts", showAuthorities, setShowAuthorities]] as const).map(([label, v, set]) => (
                <label key={label} className="flex items-center justify-between cursor-pointer">
                  <span>{label}</span>
                  <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-[#244A96]" />
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Top hotspots</h3>
            <p className="text-xs text-slate-400 mb-3">From the reports currently shown</p>
            <div className="space-y-1">
              {topClusters.map((c, i) => (
                <button key={i} onClick={() => setFocus({ lat: c.lat, lng: c.lng, key: Date.now() })}
                  className="w-full flex items-center justify-between text-left text-sm rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="font-medium truncate">{c.road}</span>
                  <span className="text-slate-500 shrink-0 ml-2 text-xs">{c.count} reports</span>
                </button>
              ))}
              {topClusters.length === 0 && <div className="text-sm text-slate-400 py-2">No clusters for these filters.</div>}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Historical risk profiles</h3>
            <p className="text-xs text-slate-400 mb-3">RTA dataset, grouped by land use and junction type. These are not tied to a location, so they are listed here rather than pinned on the map.</p>
            <div className="space-y-2">
              {topProfiles.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{h.area}</div>
                    <div className="text-xs text-slate-400">{h.junction_type} · {h.accidents} accidents · peak {String(h.peak_hour).padStart(2, "0")}:00</div>
                  </div>
                  <SeverityPill severity={h.severity} />
                </div>
              ))}
              {topProfiles.length === 0 && <div className="text-sm text-slate-400">No profiles loaded.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
