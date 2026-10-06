"use client";

import { useState } from "react";
import DemoBanner from "./DemoBanner";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Changing the key remounts the current page so it re-fetches (without a full page reload,
  // which would sign the admin out because the session is kept in memory).
  const [dataKey, setDataKey] = useState(0);
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <DemoBanner onCleared={() => setDataKey((k) => k + 1)} />
        <div key={dataKey}>{children}</div>
      </main>
    </div>
  );
}
