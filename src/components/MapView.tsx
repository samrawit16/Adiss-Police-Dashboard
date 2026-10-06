"use client";

// Real street map (OpenStreetMap tiles) centred on Addis Ababa.
// Loaded with next/dynamic (ssr: false) because Leaflet needs the browser.

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { AccidentReport, Authority } from "@/lib/types";
import type { Cluster } from "@/lib/insights";
import { SEV_COLOR, fmtDateTime, typeLabel, authorityLabel, placeLabel } from "@/lib/format";

export interface MapProps {
  reports: AccidentReport[];
  clusters: Cluster[];
  authorities: Authority[];
  showReports: boolean;
  showDensity: boolean;
  showAuthorities: boolean;
  focus: { lat: number; lng: number; key: number } | null;
}

function FlyTo({ focus }: { focus: MapProps["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 15, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export default function MapView({ reports, clusters, authorities, showReports, showDensity, showAuthorities, focus }: MapProps) {
  return (
    <MapContainer center={[9.02, 38.76]} zoom={12} minZoom={10} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo focus={focus} />

      {showDensity && clusters.filter((c) => c.count > 1).map((c, i) => (
        <Circle key={`c${i}`} center={[c.lat, c.lng]} radius={220 + c.count * 45}
          pathOptions={{ color: SEV_COLOR[c.worst] ?? "#244A96", weight: 1, fillColor: SEV_COLOR[c.worst] ?? "#244A96", fillOpacity: 0.22 }}>
          <Tooltip>{c.road}: {c.count} reports</Tooltip>
        </Circle>
      ))}

      {showReports && reports.map((r) => (
        <CircleMarker key={r.id} center={[r.latitude, r.longitude]} radius={r.severity === "critical" ? 8 : 6}
          pathOptions={{ color: "#fff", weight: 1.5, fillColor: SEV_COLOR[r.severity ?? "unknown"] ?? "#94a3b8", fillOpacity: 0.95 }}>
          <Popup>
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">#{r.id} · {typeLabel(r.report_type)}</div>
              <div>{placeLabel(r)}</div>
              <div className="text-slate-500">{fmtDateTime(r.occurred_at)}</div>
              <div className="capitalize">Severity: {r.severity ?? "unknown"} · {r.status.replace("_", " ")}</div>
              <Link href={`/reports?open=${r.id}`} className="text-blue-700 underline">Open report</Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {showAuthorities && authorities.map((a) => (
        <CircleMarker key={`a${a.id}`} center={[a.latitude, a.longitude]} radius={9}
          pathOptions={{ color: "#FFB900", weight: 3, fillColor: "#173B82", fillOpacity: 1 }}>
          <Popup>
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">{a.name}</div>
              <div className="text-slate-500">{authorityLabel(a.authority_type)}</div>
              {a.phone && <a className="text-blue-700 underline" href={`tel:${a.phone}`}>{a.phone}</a>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
