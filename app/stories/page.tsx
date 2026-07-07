"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { fetchCases } from "@/lib/api";
import { typeColor } from "@/lib/caseTypes";
import stories from "@/data/survivor-stories.json";
import type { CaseRecord } from "@/lib/types";

// Survivor stories — anonymised stories + any published survivor/witness cases
// (kept in sync with what people file through NISUP).
export default function StoriesPage() {
  const [published, setPublished] = useState<CaseRecord[]>([]);

  useEffect(() => {
    fetchCases().then((cases) =>
      setPublished(
        cases.filter(
          (c) =>
            !c.isNote && // private notes are never published
            (c.userType === "survivor" || c.userType === "witness")
        )
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Survivor stories" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <p className="mb-5 font-body-md text-on-surface-variant">
          Real voices, shared to protect others. Every story here was given by
          someone who chose to speak up.
        </p>

        {/* Published cases (live) */}
        {published.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-label-md text-label-md uppercase tracking-wider text-primary">
              Shared through NISUP
            </h2>
            <div className="flex flex-col gap-3">
              {published.map((c) => {
                const color = typeColor(c.situationType);
                return (
                  <Link
                    key={c.id}
                    href={`/case/${c.referenceId ?? c.id}`}
                    className="ambient-shadow block rounded-2xl border border-primary/5 bg-white p-5 transition-all hover:bg-primary/5"
                  >
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                      style={{ background: `${color}1a`, color }}
                    >
                      {c.situationType}
                    </span>
                    <p className="mt-2 line-clamp-2 font-body-md text-on-surface">
                      {c.summary}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 font-label-sm text-label-sm text-primary">
                      Read the case
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Curated survivor stories */}
        <section>
          <h2 className="mb-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Stories of getting through
          </h2>
          <div className="flex flex-col gap-4">
            {stories.map((s) => {
              const color = typeColor(s.situationType);
              return (
                <div
                  key={s.id}
                  className="rounded-[24px] border border-outline-variant/40 bg-white p-5"
                >
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                    style={{ background: `${color}1a`, color }}
                  >
                    {s.situationType}
                  </span>
                  <p className="mt-3 font-body-lg text-body-lg italic leading-relaxed text-on-surface">
                    &ldquo;{s.story}&rdquo;
                  </p>
                  <p className="mt-3 flex items-start gap-2 font-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      favorite
                    </span>
                    What helped: {s.whatHelped}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
