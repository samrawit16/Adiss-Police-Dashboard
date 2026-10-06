"use client";

// Wraps every dashboard page. Nothing renders until the server confirms an admin session,
// so private data never flashes on screen for a signed-out visitor. The session is kept in
// memory only (see lib/api.ts), so a fresh visit always lands on the login page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api, clearToken, getToken } from "@/lib/api";

const IDLE_MS = 30 * 60 * 1000; // sign out after 30 minutes without activity

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "offline">("checking");

  const verify = () => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setState("checking");
    api.me()
      .then(() => setState("ready"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 0) return setState("offline");
        clearToken();
        router.replace("/login");
      });
  };

  useEffect(verify, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state !== "ready") return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearToken();
        router.replace("/login");
      }, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [state, router]);

  if (state === "offline") {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="text-slate-700 font-medium">Cannot reach the server.</p>
          <p className="text-sm text-slate-500 mt-1">Check that the backend is running, then try again.</p>
          <button onClick={verify} className="mt-4 rounded-xl bg-[#173B82] px-5 py-2.5 text-sm font-medium text-white">Try again</button>
        </div>
      </div>
    );
  }
  if (state !== "ready") return <div className="min-h-screen grid place-items-center text-sm text-slate-400">Checking session…</div>;
  return <>{children}</>;
}
