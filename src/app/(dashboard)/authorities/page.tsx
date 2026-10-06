"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { api } from "@/lib/api";
import { authorityLabel } from "@/lib/format";
import type { Authority } from "@/lib/types";

const TYPE_ICON: Record<string, string> = { police: "⛨", traffic: "🚦", fire_emergency: "🚒", medical_support: "🚑" };
const TYPE_COLOR: Record<string, string> = { police: "bg-[#244A96]", traffic: "bg-[#FFB900]", fire_emergency: "bg-red-500", medical_support: "bg-emerald-600" };

export default function Authorities() {
  const [list, setList] = useState<Authority[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.authorities().then(setList).catch((e) => { setList([]); setError(e.message); }); }, []);

  // Build the filter tabs from the types that actually exist in the registry.
  const types = useMemo(() => ["all", ...Array.from(new Set((list ?? []).map((a) => a.authority_type)))], [list]);
  const visible = (list ?? []).filter((a) => filter === "all" || a.authority_type === filter);

  return (
    <div className="pb-12">
      <TopBar title="Authorities" subtitle="Emergency responders and dispatch contacts" />
      {error && <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">Could not load authorities: {error}</div>}
      <div className="px-6 lg:px-10 mt-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filter === t ? "bg-[#173B82] text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}>
              {t === "all" ? "All" : authorityLabel(t)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((a) => (
            <div key={a.id} className="card">
              <div className={`h-12 w-12 rounded-xl ${TYPE_COLOR[a.authority_type] ?? "bg-slate-500"} grid place-items-center text-xl text-white`}>
                {TYPE_ICON[a.authority_type] ?? "⛨"}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{a.name}</h3>
              <p className="text-sm text-slate-500">{a.coverage_area ?? "—"} · {authorityLabel(a.authority_type)}</p>
              <div className="mt-4 space-y-1 text-sm">
                {a.phone && <div>📞 <a href={`tel:${a.phone}`} className="text-blue-700 hover:underline font-medium">{a.phone}</a></div>}
                {a.email && <div>✉️ <a href={`mailto:${a.email}`} className="text-blue-700 hover:underline">{a.email}</a></div>}
                <div className="text-xs">
                  <a className="text-slate-500 hover:text-blue-700 hover:underline" target="_blank" rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=16/${a.latitude}/${a.longitude}`}>
                    📍 {a.latitude.toFixed(3)}, {a.longitude.toFixed(3)}
                  </a>
                </div>
              </div>
            </div>
          ))}
          {list === null && <div className="text-sm text-slate-400">Loading…</div>}
          {list !== null && visible.length === 0 && !error && <div className="text-sm text-slate-400">No authorities registered.</div>}
        </div>
      </div>
    </div>
  );
}
