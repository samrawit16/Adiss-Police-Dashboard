// The backend stores naive UTC timestamps (no "Z"). Parse them as UTC and show them
// in Addis Ababa time (UTC+3, no DST) so an officer sees the real local time.

const TZ = "Africa/Addis_Ababa";

export function parseUtc(s: string): Date {
  return new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(s) ? s : `${s}Z`);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});
const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", weekday: "short", hour12: false,
});

export const fmtDate = (s: string) => dateFmt.format(parseUtc(s));
export const fmtDateTime = (s: string) => dateTimeFmt.format(parseUtc(s));

/** Local (Addis) calendar parts for a stored timestamp. */
export function addisParts(s: string) {
  const p = Object.fromEntries(partsFmt.formatToParts(parseUtc(s)).map((x) => [x.type, x.value]));
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    year: Number(p.year),
    month: Number(p.month) - 1,
    hour: Number(p.hour) % 24,
    weekday: weekdays.indexOf(p.weekday),
  };
}

export function timeAgo(s: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - parseUtc(s).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 45) return `${days} d ago`;
  return fmtDate(s);
}

export const TYPE_LABEL: Record<string, string> = {
  road_accident: "Road accident",
  hit_and_run: "Hit and run",
  hazard: "Road hazard",
  vehicle_breakdown: "Vehicle breakdown",
  other: "Other",
};
export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t.replace(/_/g, " ");

export const EVENT_LABEL: Record<string, string> = {
  speed_limit_warning: "Speed limit warning",
  unsafe_speed: "Unsafe speed",
  phone_use_near_traffic: "Phone use near traffic",
  safe_trip_check: "Safe trip check",
};
export const eventLabel = (t: string) => EVENT_LABEL[t] ?? t.replace(/_/g, " ");

export const AUTHORITY_LABEL: Record<string, string> = {
  police: "Police",
  traffic: "Traffic police",
  fire_emergency: "Fire & emergency",
  fire: "Fire & emergency",
  medical_support: "Medical / ambulance",
  ambulance: "Medical / ambulance",
};
export const authorityLabel = (t: string) => AUTHORITY_LABEL[t] ?? t.replace(/_/g, " ");

// Severity as reported by citizens (minor | serious | critical | unknown).
export const SEV_ORDER = ["critical", "serious", "minor", "unknown"] as const;
export const SEV_COLOR: Record<string, string> = {
  critical: "#dc2626",
  serious: "#ea580c",
  minor: "#4E74D8",
  unknown: "#94a3b8",
};

/** Road name when known; otherwise the GPS position so the location is never blank. */
export function placeLabel(r: { road_name: string | null; latitude: number; longitude: number }): string {
  return r.road_name?.trim() || `GPS ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`;
}
