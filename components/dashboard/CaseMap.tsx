"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { CaseRecord } from "@/lib/types";
import { typeColor } from "@/lib/caseTypes";

// Case map with free OpenStreetMap tiles (no API key). Markers are colour-coded
// by situationType. Rendered client-only via a dynamic import (see index.tsx).
export default function CaseMap({ cases }: { cases: CaseRecord[] }) {
  const withCoords = cases.filter(
    (c) => typeof c.lat === "number" && typeof c.lng === "number"
  );
  const center: [number, number] = withCoords.length
    ? [withCoords[0].lat!, withCoords[0].lng!]
    : [28.6139, 77.209];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {withCoords.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.lat!, c.lng!]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: typeColor(c.situationType),
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{c.situationType}</p>
              <p>{c.location}</p>
              <p className="text-xs text-slate-500">
                {c.urgency} urgency · {c.status ?? "New"}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
