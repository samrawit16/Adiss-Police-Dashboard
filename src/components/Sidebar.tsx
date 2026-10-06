"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { backendOnline, clearToken } from "@/lib/api";

const NAV = [
  { href: "/overview", label: "Overview", icon: "▦" },
  { href: "/reports", label: "Accident Reports", icon: "📄" },
  { href: "/map", label: "Hotspot Map", icon: "◎" },
  { href: "/analytics", label: "Analytics", icon: "◔" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/authorities", label: "Authorities", icon: "⛨" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => backendOnline().then((ok) => alive && setOnline(ok));
    check();
    const t = setInterval(check, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const logout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-[#173B82] text-white px-3 py-2 lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        ☰
      </button>
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-[#173B82] text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        onClick={() => open && setOpen(false)}
      >
        <div className="flex items-center gap-3 px-6 pt-8 pb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 grid place-items-center text-xl font-black">A</div>
          <div>
            <div className="font-bold text-lg leading-tight">Adiss Road</div>
            <div className="text-xs text-sky-300">Police Command</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active ? "bg-[#244A96] text-white shadow-lg shadow-blue-900/40" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 pb-6 text-xs text-slate-300 space-y-4">
          <div className="h-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${online === null ? "bg-slate-400" : online ? "bg-lime-400 animate-pulse" : "bg-red-500"}`} />
            {online === null ? "Checking API…" : online ? "API online" : "API unreachable"}
          </div>
          <button onClick={logout} className="w-full rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-white transition">
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
