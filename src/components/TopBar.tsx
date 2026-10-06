"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminMe } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "A";
}

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [awaiting, setAwaiting] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    const load = () => api.stats().then((s) => setAwaiting(s.submitted)).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/reports?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white/80 backdrop-blur px-6 lg:px-10 py-5 border-b border-slate-100 pl-16 lg:pl-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <form onSubmit={search} className="hidden md:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-400 w-72">
          <span>⌕</span>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            className="bg-transparent w-full outline-none text-slate-700"
            placeholder="Search report ID, reporter, road…"
          />
        </form>
        <Link href="/reports?status=submitted" className="relative h-10 w-10 rounded-full bg-slate-100 grid place-items-center" aria-label={`${awaiting} reports awaiting action`} title={`${awaiting} reports awaiting action`}>
          🔔
          {awaiting > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-[10px] text-white grid place-items-center px-1">
              {awaiting > 99 ? "99+" : awaiting}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2" title={me?.email}>
          <div className="h-10 w-10 rounded-full bg-[#173B82] text-white grid place-items-center text-sm font-bold">
            {me ? initials(me.full_name) : "…"}
          </div>
          {me && <div className="hidden xl:block text-sm font-medium text-slate-700 max-w-[10rem] truncate">{me.full_name}</div>}
        </div>
      </div>
    </header>
  );
}
