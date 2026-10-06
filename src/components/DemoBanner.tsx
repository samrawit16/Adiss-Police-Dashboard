"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DemoData } from "@/lib/types";

// Shown only while fictional sample rows exist in the database. Real reports from the
// mobile app are never affected by "Remove sample data".
export default function DemoBanner({ onCleared }: { onCleared: () => void }) {
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.demoData().then(setDemo).catch(() => {});
  }, []);

  if (!demo?.present) return null;

  const remove = async () => {
    const ok = window.confirm(
      `Delete ${demo.reports} sample reports and ${demo.events} sample events?\n\nReal reports sent from the app are NOT deleted.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      setDemo(await api.removeDemoData());
      onCleared();
    } catch (e: any) {
      setError(e.message ?? "Could not remove sample data");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 lg:px-10 py-2.5 pl-16 lg:pl-10 text-sm text-amber-900 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>
        <strong>Sample data is mixed in.</strong> {demo.reports} fictional reports and {demo.events} events are shown next to real ones from the app (marked SAMPLE).
      </span>
      <button onClick={remove} disabled={busy} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
        {busy ? "Removing…" : "Remove sample data"}
      </button>
      {error && <span className="text-red-700">{error}</span>}
    </div>
  );
}
