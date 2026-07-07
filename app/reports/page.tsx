"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { fetchCases } from "@/lib/api";
import { typeColor, URGENCY_STYLES, STATUS_STYLES } from "@/lib/caseTypes";
import type { CaseRecord } from "@/lib/types";

// My reports — every case filed through NISUP, linking to its article. Kept in
// sync with the Authority Dashboard (same store).
export default function ReportsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My reports" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <p className="mb-5 font-body-md text-on-surface-variant">
          Reports filed through NISUP. Each one is routed to an authority and has
          its own case page.
        </p>

        {loading ? (
          <p className="text-on-surface-variant">Loading…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {cases.map((c) => {
              const color = typeColor(c.situationType);
              return (
                <Link
                  key={c.id}
                  href={`/case/${c.referenceId ?? c.id}`}
                  className="block rounded-2xl border border-outline-variant/40 bg-white p-4 transition-all hover:shadow-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                        style={{ background: `${color}1a`, color }}
                      >
                        {c.situationType}
                      </span>
                      {c.isNote && (
                        <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                          Private note
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {c.referenceId ?? c.id}
                    </span>
                  </div>
                  <p className="line-clamp-2 font-body-md text-on-surface">
                    {c.summary}
                  </p>
                  <div className="mt-2 flex items-center gap-2 font-label-sm text-label-sm">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${
                        STATUS_STYLES[c.status ?? "New"]
                      }`}
                    >
                      {c.status ?? "New"}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${
                        URGENCY_STYLES[c.urgency]
                      }`}
                    >
                      {c.urgency}
                    </span>
                    <span className="text-on-surface-variant">
                      {c.createdAt ?? c.dates}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
