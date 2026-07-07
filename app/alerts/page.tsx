"use client";

import { PageHeader } from "@/components/PageHeader";
import { typeColor } from "@/lib/caseTypes";
import alerts from "@/data/alerts.json";

// Alerts near me — community safety alerts (ported from the Stitch alert card).
export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Alerts near me" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <p className="mb-5 font-body-md text-on-surface-variant">
          Alerts shared by the community to help you stay safe. If one matches
          your situation, you can act early.
        </p>
        <div className="flex flex-col gap-4">
          {alerts.map((a) => {
            const color = typeColor(a.situationType);
            return (
              <div
                key={a.id}
                className="ambient-shadow rounded-[24px] border border-amber/20 bg-white p-5"
              >
                <div className="mb-2 flex items-center gap-2 text-amber">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shield
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-wider">
                    Safety Alert
                  </span>
                </div>
                <p className="font-body-lg text-body-lg italic leading-relaxed text-on-surface">
                  &ldquo;{a.message}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
                  <span
                    className="rounded-md px-2 py-0.5 font-semibold uppercase"
                    style={{ background: `${color}1a`, color }}
                  >
                    {a.situationType}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      location_on
                    </span>
                    {a.area}
                  </span>
                  <span>{a.postedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
