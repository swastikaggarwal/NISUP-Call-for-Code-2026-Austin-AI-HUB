"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { fetchCases } from "@/lib/api";
import { typeColor, STATUS_STYLES } from "@/lib/caseTypes";
import authorities from "@/data/authorities.json";
import type { CaseRecord } from "@/lib/types";

// Case tracking page — a reporter-facing status tracker. Shows a live timeline
// (filed → routed → authority reviewing → action taken), the authority's
// contact details, and any status updates. Polls so authority actions appear
// live without a manual refresh.
export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const cases = await fetchCases();
      const found = cases.find(
        (c) => c.id === params.id || c.referenceId === params.id
      );
      if (alive) {
        if (found) setRecord(found);
        setUpdatedAt(new Date());
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 5000); // live sync
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [params.id]);

  const authority = useMemo(
    () =>
      authorities.find((a) => a.name === record?.matchedAuthority) ??
      authorities.find((a) =>
        record ? a.situationTypes.includes(record.situationType) : false
      ),
    [record]
  );

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Track your case" />
        <p className="p-8 text-on-surface-variant">Loading…</p>
      </div>
    );

  if (!record)
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Track your case" />
        <p className="p-8 text-on-surface-variant">
          We couldn&apos;t find a case with that reference.
        </p>
      </div>
    );

  const status = record.status ?? "New";
  const reviewing = status === "In Review" || status === "Action Taken";
  const acted = status === "Action Taken";

  const steps = [
    {
      label: "Report filed",
      detail: `Reference ${record.referenceId ?? record.id}`,
      done: true,
      icon: "task_alt",
    },
    {
      label: "Routed to authority",
      detail:
        authority?.name ??
        record.matchedAuthority ??
        "National Anti-Trafficking Helpline",
      done: true,
      icon: "send",
    },
    {
      label: "Authority reviewing",
      detail: reviewing
        ? "An officer has opened your case."
        : "Waiting for the authority to open your case.",
      done: reviewing,
      icon: "visibility",
    },
    {
      label: "Action taken",
      detail: acted
        ? "The authority has recorded an action on your case."
        : "No action recorded yet.",
      done: acted,
      icon: "gavel",
    },
  ];
  const color = typeColor(record.situationType);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Track your case" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        {/* Summary card */}
        <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span
              className="rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ background: `${color}1a`, color }}
            >
              {record.situationType}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
            >
              {status}
            </span>
          </div>
          <p className="font-body-md text-on-surface">{record.summary}</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                Reference ID
              </p>
              <p className="text-xl font-bold tracking-wider text-primary">
                {record.referenceId ?? record.id}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live
            </span>
          </div>
        </div>

        {/* Timeline */}
        <h2 className="mb-3 mt-8 font-headline-md text-headline-md text-on-surface">
          Progress
        </h2>
        <ol className="relative ml-3 border-l-2 border-outline-variant/40">
          {steps.map((s) => (
            <li key={s.label} className="mb-6 ml-6">
              <span
                className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ${
                  s.done
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {s.done ? "check" : s.icon}
                </span>
              </span>
              <p
                className={`font-body-md font-semibold ${
                  s.done ? "text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {s.label}
              </p>
              <p className="text-label-sm text-on-surface-variant">{s.detail}</p>
            </li>
          ))}
        </ol>

        {/* Status history */}
        {record.history && record.history.length > 0 && (
          <div className="mb-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Update log
            </p>
            <ul className="flex flex-col gap-1.5">
              {record.history.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    history
                  </span>
                  {h.label}
                  <span className="text-on-surface-variant">
                    · {new Date(h.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Authority contact */}
        {authority && (
          <div className="rounded-2xl border border-primary/20 bg-secondary-container/25 p-5">
            <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wide text-primary">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              Handling authority
            </p>
            <p className="font-body-md font-semibold text-on-surface">
              {authority.name}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {authority.type} · {authority.region}
            </p>
            {record.contacts && record.contacts !== "Unknown" ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-surface-container-lowest/70 p-2.5 text-label-sm text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  support_agent
                </span>
                The authority may reach out to you at the contact you shared
                ({record.contacts}).
              </p>
            ) : (
              <p className="mt-2 text-label-sm text-on-surface-variant">
                You can contact them directly using the details below.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${authority.phone.replace(/[^+\d]/g, "")}`}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-label-md text-label-md text-on-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                {authority.phone}
              </a>
              <a
                href={`mailto:${authority.email}`}
                className="flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 font-label-md text-label-md text-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email
              </a>
            </div>
          </div>
        )}

        {updatedAt && (
          <p className="mt-4 text-center text-xs text-on-surface-variant">
            Updated {updatedAt.toLocaleTimeString()} · refreshes automatically
          </p>
        )}
      </main>
    </div>
  );
}
