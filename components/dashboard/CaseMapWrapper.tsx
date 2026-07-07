"use client";

import dynamic from "next/dynamic";
import type { CaseRecord } from "@/lib/types";
import { typeColor, TYPE_COLORS } from "@/lib/caseTypes";

// Leaflet touches `window`, so load the map client-side only.
const CaseMap = dynamic(() => import("./CaseMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0f2320] text-sm text-white/60">
      Loading map…
    </div>
  ),
});

const LEGEND = [
  "Forced labour",
  "Sex trafficking",
  "Child labour",
  "Forced marriage",
  "Fake job scam",
];

export function CaseMapWrapper({ cases }: { cases: CaseRecord[] }) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl bg-[#0f2320]">
      <CaseMap cases={cases} />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-surface-container-lowest/95 p-3 text-xs shadow-lg backdrop-blur">
        <p className="mb-2 font-semibold uppercase tracking-wide text-on-surface-variant">
          Case legend
        </p>
        <ul className="space-y-1.5">
          {LEGEND.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TYPE_COLORS[t] ?? typeColor(t) }}
              />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
