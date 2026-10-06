// Everything here is derived from real citizen reports: no invented positions.
import type { AccidentReport } from "./types";
import { addisParts, parseUtc } from "./format";

const WEIGHT: Record<string, number> = { critical: 10, serious: 5, minor: 1, unknown: 1 };
const COLLISION_TYPES = new Set(["road_accident", "hit_and_run"]);

export const isCollision = (r: AccidentReport) => COLLISION_TYPES.has(r.report_type);

export function withinDays(reports: AccidentReport[], days: number) {
  const cutoff = Date.now() - days * 86_400_000;
  return reports.filter((r) => parseUtc(r.occurred_at).getTime() >= cutoff);
}

export interface RoadStat {
  road: string;
  total: number;
  collisions: number;
  critical: number;
  serious: number;
  emergencies: number;
  score: number;
}

export function roadHotspots(reports: AccidentReport[]): RoadStat[] {
  const m = new Map<string, RoadStat>();
  for (const r of reports) {
    const road = r.road_name?.trim();
    if (!road) continue; // a ranking of roads only makes sense for reports that name the road
    const s = m.get(road) ?? { road, total: 0, collisions: 0, critical: 0, serious: 0, emergencies: 0, score: 0 };
    s.total += 1;
    if (isCollision(r)) s.collisions += 1;
    if (r.severity === "critical") s.critical += 1;
    if (r.severity === "serious") s.serious += 1;
    if (r.emergency_required) s.emergencies += 1;
    s.score += WEIGHT[r.severity ?? "unknown"] ?? 1;
    m.set(road, s);
  }
  return [...m.values()].sort((a, b) => b.score - a.score);
}

export function byHour(reports: AccidentReport[]): number[] {
  const out = Array(24).fill(0);
  for (const r of reports) out[addisParts(r.occurred_at).hour] += 1;
  return out;
}

export function byWeekday(reports: AccidentReport[]): number[] {
  const out = Array(7).fill(0);
  for (const r of reports) {
    const d = addisParts(r.occurred_at).weekday;
    if (d >= 0) out[d] += 1;
  }
  return out;
}

export function countBy<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  score: number;
  road: string;
  worst: string;
}

/** Groups reports into ~500 m grid cells so real hotspots stand out on the map. */
export function clusterReports(reports: AccidentReport[], cell = 0.0045): Cluster[] {
  const cells = new Map<string, AccidentReport[]>();
  for (const r of reports) {
    const key = `${Math.round(r.latitude / cell)}:${Math.round(r.longitude / cell)}`;
    (cells.get(key) ?? cells.set(key, []).get(key)!).push(r);
  }
  return [...cells.values()]
    .map((rs) => {
      const roads = new Map<string, number>();
      let score = 0;
      let worst = "unknown";
      for (const r of rs) {
        score += WEIGHT[r.severity ?? "unknown"] ?? 1;
        const road = r.road_name ?? "Unnamed road";
        roads.set(road, (roads.get(road) ?? 0) + 1);
        if ((WEIGHT[r.severity ?? "unknown"] ?? 0) > (WEIGHT[worst] ?? 0)) worst = r.severity ?? "unknown";
      }
      return {
        lat: rs.reduce((a, r) => a + r.latitude, 0) / rs.length,
        lng: rs.reduce((a, r) => a + r.longitude, 0) / rs.length,
        count: rs.length,
        score,
        road: [...roads.entries()].sort((a, b) => b[1] - a[1])[0][0],
        worst,
      };
    })
    .sort((a, b) => b.score - a.score);
}
