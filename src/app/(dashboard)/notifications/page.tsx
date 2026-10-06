"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { api } from "@/lib/api";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { AdminNotification, NotificationCategory } from "@/lib/types";

const CATEGORIES: { key: NotificationCategory; label: string; icon: string; badge: string }[] = [
  { key: "announcement", label: "Announcement", icon: "📢", badge: "bg-blue-100 text-blue-700" },
  { key: "safety_tip", label: "Safety tip", icon: "💡", badge: "bg-emerald-100 text-emerald-700" },
  { key: "road_alert", label: "Road alert", icon: "🚧", badge: "bg-orange-100 text-orange-700" },
  { key: "warning", label: "Warning", icon: "⚠️", badge: "bg-red-100 text-red-700" },
];
const catOf = (key: string) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

const TEMPLATES: { label: string; category: NotificationCategory; title: string; message: string }[] = [
  { label: "Rain warning", category: "warning", title: "Heavy rain expected", message: "Heavy rain is expected today. Roads will be slippery: reduce your speed, keep more distance and switch on your lights." },
  { label: "Road closure", category: "road_alert", title: "Road closed", message: "This road is closed. Please use another route and follow the traffic officers' instructions." },
  { label: "Safety tip", category: "safety_tip", title: "Do not use your phone while driving", message: "Texting or calling while driving is a leading cause of crashes. Pull over safely first." },
];

const MAX_TITLE = 80;
const MAX_MESSAGE = 500;

export default function NotificationsPage() {
  const [category, setCategory] = useState<NotificationCategory>("announcement");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<AdminNotification[] | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.notifications().then(setHistory).catch((e) => { setHistory([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !sending;
  const cat = catOf(category);

  const send = async () => {
    if (!canSend) return;
    const ok = window.confirm(`Send this to ALL app users?\n\n${cat.icon} ${title.trim()}\n${message.trim()}`);
    if (!ok) return;
    setSending(true);
    setNotice(null);
    try {
      const sent = await api.sendNotification({ title: title.trim(), message: message.trim(), category });
      setNotice({ ok: true, text: `Sent. It will appear in the bell of ${sent.recipients} app user${sent.recipients === 1 ? "" : "s"}.` });
      setTitle("");
      setMessage("");
      setHistory((h) => [sent, ...(h ?? [])]);
    } catch (e: any) {
      setNotice({ ok: false, text: e.message ?? "Could not send the notification" });
    } finally {
      setSending(false);
    }
  };

  const retract = async (n: AdminNotification) => {
    if (!window.confirm(`Remove "${n.title}" for everyone? It will disappear from the users' apps.`)) return;
    try {
      await api.deleteNotification(n.id);
      setHistory((h) => (h ?? []).filter((x) => x.id !== n.id));
    } catch (e: any) {
      setError(e.message ?? "Could not remove the notification");
    }
  };

  return (
    <div className="pb-12">
      <TopBar title="Notifications" subtitle="Write a message that appears in the bell of every app user" />
      {error && <div className="mx-6 lg:mx-10 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">{error}</div>}

      <div className="px-6 lg:px-10 mt-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="card xl:col-span-3 space-y-5">
          <h3 className="card-title">New notification</h3>

          <div>
            <div className="text-xs uppercase text-slate-400 mb-2">Type</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${category === c.key ? "bg-[#173B82] text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <span className="mr-1.5">{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs uppercase text-slate-400 mb-2">
              <label htmlFor="n-title">Title</label>
              <span className={title.length > MAX_TITLE ? "text-red-500" : ""}>{title.length}/{MAX_TITLE}</span>
            </div>
            <input id="n-title" value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bole Road closed until 6 pm"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          </div>

          <div>
            <div className="flex justify-between text-xs uppercase text-slate-400 mb-2">
              <label htmlFor="n-message">Message</label>
              <span>{message.length}/{MAX_MESSAGE}</span>
            </div>
            <textarea id="n-message" value={message} maxLength={MAX_MESSAGE} rows={5} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write what drivers and pedestrians need to know."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-y" />
          </div>

          <div>
            <div className="text-xs uppercase text-slate-400 mb-2">Quick templates</div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setCategory(t.category); setTitle(t.title); setMessage(t.message); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={send} disabled={!canSend}
              className="rounded-xl bg-[#FFB900] px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? "Sending…" : "Send to all app users"}
            </button>
            {notice && <span className={`text-sm ${notice.ok ? "text-emerald-700" : "text-red-700"}`}>{notice.text}</span>}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-3">
          <div className="text-xs uppercase text-slate-400">Preview in the app</div>
          <div className="rounded-2xl bg-[#173B82] p-4 shadow-sm">
            <div className="rounded-xl bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="text-lg">{cat.icon}</span>
                <span className="truncate">{title.trim() || "Notification title"}</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-line break-words">{message.trim() || "Your message will appear here."}</p>
              <div className="mt-2 text-[11px] text-slate-400">just now · {cat.label}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Everyone with an account sees it in the bell of the app, and the bell counter goes up until they open it.
            Citizens also get a private notification automatically when you change the status of their report.
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 mt-6">
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="card-title">Sent notifications</h3>
            <span className="text-xs text-slate-400">{history?.length ?? 0} sent</span>
          </div>
          <div className="divide-y">
            {(history ?? []).map((n) => {
              const c = catOf(n.category);
              const pct = n.recipients > 0 ? Math.min(100, Math.round((n.read_count / n.recipients) * 100)) : 0;
              return (
                <div key={n.id} className="px-5 py-4 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${c.badge}`}>{c.icon} {c.label}</span>
                      <span className="font-semibold text-slate-900 break-words">{n.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-line break-words">{n.message}</p>
                    <div className="mt-1.5 text-xs text-slate-400" title={fmtDateTime(n.created_at)}>
                      {timeAgo(n.created_at)}{n.sent_by ? ` · by ${n.sent_by}` : ""}
                    </div>
                  </div>
                  <div className="md:w-52 shrink-0">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Opened by</span>
                      <span className="tabular-nums">{n.read_count} of {n.recipients}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#4E74D8]" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <button onClick={() => retract(n)} className="self-start rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700">
                    Remove
                  </button>
                </div>
              );
            })}
            {history === null && <div className="px-5 py-10 text-center text-sm text-slate-400">Loading…</div>}
            {history !== null && history.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">No notifications sent yet. Write one above and every app user will see it.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
