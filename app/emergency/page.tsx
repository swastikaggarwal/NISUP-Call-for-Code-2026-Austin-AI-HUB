"use client";

import { PageHeader } from "@/components/PageHeader";
import authorities from "@/data/authorities.json";

// Emergency help — quick access to helplines and police, with tap-to-call.
export default function EmergencyPage() {
  const urgent = authorities.filter((a) =>
    /helpline|police|child protection/i.test(a.type)
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Emergency help" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-5 rounded-2xl border-l-4 border-[#993C1D] bg-[#993C1D]/10 p-5">
          <p className="font-body-md text-on-surface">
            If you are in immediate danger, call your local emergency number now.
            You do not have to face this alone.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {urgent.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-body-md font-semibold text-on-surface">
                  {a.name}
                </p>
                <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                  {a.type} · {a.region}
                </p>
              </div>
              <a
                href={`tel:${a.phone.replace(/[^+\d]/g, "")}`}
                className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                {a.phone}
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
