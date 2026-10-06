// Talks to the FastAPI backend through the /api/v1 rewrite in next.config.ts.
//
// Tokens: the access token is short-lived (30 min by default). On a 401 the client
// silently exchanges the refresh token for a new pair and retries once; if that also
// fails the session is cleared and the user is sent to /login.
// A 403 means "signed in, but not an admin" and never triggers a logout loop.

import type { AccidentReport, AdminMe, AdminNotification, AdminStats, Authority, DemoData, Hotspot, NotificationCategory, SafetyEvent } from "./types";

// Sign-in lives in memory only: it is never written to localStorage/sessionStorage, so
// opening the dashboard link, reloading the page or starting a new tab always asks for the
// admin email and password. (Moving between dashboard pages does not reload, so it keeps you in.)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Sessions saved by older versions of this dashboard must not sign anyone in any more.
if (typeof window !== "undefined") {
  for (const key of ["adiss_admin_token", "adiss_admin_refresh"]) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

export const getToken = () => accessToken;
export function clearToken() {
  accessToken = null;
  refreshToken = null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toLogin() {
  clearToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  const refresh = refreshToken;
  if (!refresh) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return body.detail.map((d: any) => d.msg).join(", ");
  } catch {}
  return res.statusText || `Request failed (${res.status})`;
}

async function request<T>(url: string, init?: RequestInit, retry = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init?.headers as Record<string, string>) ?? {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check that the backend is running.");
  }

  if (res.status === 401 && retry && url !== "/api/v1/auth/login") {
    if (await refreshSession()) return request<T>(url, init, false);
    toLogin();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (res.status === 204) return undefined as T; // e.g. DELETE: nothing to parse
  return (await res.json()) as T;
}

/** Signs in and verifies the account really is an admin before keeping the session. */
export async function login(email: string, password: string): Promise<AdminMe> {
  clearToken();
  const data = await request<{ access_token: string; refresh_token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  try {
    return await api.me();
  } catch (err) {
    clearToken();
    if (err instanceof ApiError && err.status === 403) {
      throw new ApiError(403, "This account does not have police admin access.");
    }
    throw err;
  }
}

export async function backendOnline(): Promise<boolean> {
  try {
    const res = await fetch("/backend-health", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  me: () => request<AdminMe>("/api/v1/admin/me"),
  stats: () => request<AdminStats>("/api/v1/admin/stats"),
  reports: (status?: string) =>
    request<AccidentReport[]>(`/api/v1/admin/reports${status ? `?status=${status}` : ""}`),
  hotspots: () => request<Hotspot[]>("/api/v1/hotspots"),
  // The backend exposes authorities as a nearby search: query the centre of Addis Ababa with a wide radius.
  authorities: () =>
    request<Authority[]>("/api/v1/safety/authorities?latitude=9.03&longitude=38.74&radius_km=100"),
  events: (days = 30) => request<SafetyEvent[]>(`/api/v1/admin/events?days=${days}`),
  notifications: () => request<AdminNotification[]>("/api/v1/admin/notifications"),
  sendNotification: (body: { title: string; message: string; category: NotificationCategory }) =>
    request<AdminNotification>("/api/v1/admin/notifications", { method: "POST", body: JSON.stringify(body) }),
  deleteNotification: (id: number) => request<void>(`/api/v1/admin/notifications/${id}`, { method: "DELETE" }),
  demoData: () => request<DemoData>("/api/v1/admin/demo-data"),
  removeDemoData: () => request<DemoData>("/api/v1/admin/demo-data", { method: "DELETE" }),
  updateReportStatus: (id: number, status: string) =>
    request<AccidentReport>(`/api/v1/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
