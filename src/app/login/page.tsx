"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  // No register form by design: admin access is granted by the backend, not self-service.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email, password);
      router.replace("/overview");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="relative min-h-screen grid place-items-center px-4 py-10"
      style={{
        backgroundImage: "url(/login-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* soft veil so the card pops */}
      <div className="absolute inset-0" style={{ background: "rgba(23,59,130,0.18)" }} />

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-3xl px-10 py-12 text-slate-800"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.62), rgba(191,212,245,0.38))",
          backdropFilter: "blur(18px) saturate(1.2)",
          WebkitBackdropFilter: "blur(18px) saturate(1.2)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 24px 60px rgba(10,25,60,0.35)",
        }}
      >
        {/* brand */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto grid place-items-center text-white text-2xl font-bold mb-4"
            style={{ background: "linear-gradient(135deg,#173B82,#244A96)", boxShadow: "0 10px 24px rgba(23,59,130,0.4)" }}
          >
            A
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide" style={{ color: "#173B82" }}>
            LOGIN
          </h1>
          <p className="text-sm text-slate-600 mt-1">Adiss Road — Police Command</p>
        </div>

        {/* email */}
        <label className="block text-sm font-semibold mb-1" style={{ color: "#173B82" }}>Email</label>
        <div className="flex items-center gap-2 mb-5" style={{ borderBottom: "2px solid rgba(23,59,130,0.45)" }}>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" autoFocus
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
            placeholder="admin@adissroad.gov.et"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#173B82" strokeWidth="2" className="shrink-0">
            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
          </svg>
        </div>

        {/* password */}
        <label className="block text-sm font-semibold mb-1" style={{ color: "#173B82" }}>Password</label>
        <div className="flex items-center gap-2 mb-2" style={{ borderBottom: "2px solid rgba(23,59,130,0.45)" }}>
          <input
            type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="shrink-0" aria-label="Toggle password visibility">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#173B82" strokeWidth="2">
              {showPw ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>
                     : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><path d="m3 3 18 18"/></>}
            </svg>
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-100/80 rounded-lg px-3 py-2 mb-3">{error}</div>
        )}

        <p className="text-xs text-slate-600 mb-6 text-center">You will be asked to sign in every time you open this dashboard.</p>

        <button
          type="submit" disabled={busy}
          className="w-full rounded-full py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#173B82,#244A96)", boxShadow: "0 10px 24px rgba(23,59,130,0.45)" }}
        >
          {busy ? "Signing in…" : "Login"}
        </button>

        <p className="text-xs text-slate-600 text-center mt-6">
          Authorised police personnel only
        </p>
      </form>
    </div>
  );
}
