"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Paperclip,
  Phone,
  Lightbulb,
  Play,
  Pause,
} from "lucide-react";
import { fetchCases, fetchNexus, updateStatus } from "@/lib/api";
import { URGENCY_STYLES, typeColor } from "@/lib/caseTypes";
import type { CaseRecord, CaseStatus, NexusLink } from "@/lib/types";

const STATUSES: CaseStatus[] = ["New", "In Review", "Action Taken"];

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [status, setStatus] = useState<CaseStatus>("New");
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [nexus, setNexus] = useState<NexusLink[]>([]);

  useEffect(() => {
    fetchCases()
      .then((cases) => {
        const found = cases.find(
          (c) => c.id === params.id || c.referenceId === params.id
        );
        setRecord(found ?? null);
        if (found?.status) setStatus(found.status);
      })
      .finally(() => setLoading(false));
    fetchNexus(params.id).then(setNexus);
  }, [params.id]);

  // Recorded-conversation player: steps through transcript turns, reading each
  // aloud with the browser voice (a lightweight "playback" for the demo).
  const transcript = useMemo(() => record?.transcript ?? [], [record]);

  const playFrom = (i: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const turn = transcript[i];
    if (!turn) {
      setPlayingIdx(null);
      return;
    }
    setPlayingIdx(i);
    const u = new SpeechSynthesisUtterance(turn.content);
    u.rate = 1;
    u.onend = () => playFrom(i + 1);
    window.speechSynthesis.speak(u);
  };

  const stopPlay = () => {
    window.speechSynthesis?.cancel();
    setPlayingIdx(null);
  };

  if (loading)
    return <p className="text-on-surface-variant">Loading case…</p>;
  if (!record)
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-on-surface-variant">Case not found.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink />

      {/* Header */}
      <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
              style={{
                background: `${typeColor(record.situationType)}1a`,
                color: typeColor(record.situationType),
              }}
            >
              {record.situationType}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                URGENCY_STYLES[record.urgency]
              }`}
            >
              {record.urgency} urgency
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Case {record.referenceId ?? record.id}
          </h1>
        </div>

        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as CaseStatus;
            setStatus(next);
            // Persist so the reporter's tracking page updates live.
            updateStatus(record.id, next);
          }}
          className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-4 py-2 text-sm font-medium outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: AI brief + conversation */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
              AI case brief
            </h2>
            <p className="text-[15px] leading-relaxed text-on-surface">
              {record.summary}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Meta icon={MapPin} label="Location" value={record.location} />
              <Meta icon={Users} label="People involved" value={record.peopleInvolved} />
              <Meta icon={Calendar} label="Dates" value={record.dates ?? record.createdAt ?? "Unknown"} />
              <Meta icon={Paperclip} label="Evidence" value={record.evidence} />
              {record.contacts && record.contacts !== "Unknown" && (
                <Meta icon={Phone} label="Contacts" value={record.contacts} />
              )}
            </div>

            {/* Risk indicators — the triage flags behind this case */}
            {record.redFlags && record.redFlags.length > 0 && (
              <div className="mt-4 rounded-xl border-l-4 border-[#993C1D] bg-[#993C1D]/5 p-4">
                <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#993C1D]">
                  <span>
                    Risk indicators ({record.redFlags.length} red flag
                    {record.redFlags.length > 1 ? "s" : ""} detected)
                  </span>
                  {record.riskBand && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        record.riskBand === "red"
                          ? "bg-[#993C1D]/15 text-[#993C1D]"
                          : record.riskBand === "amber"
                            ? "bg-amber/15 text-amber"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {record.riskBand}
                    </span>
                  )}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {record.redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] text-on-surface">
                      <span className="text-[#993C1D]">🚩</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {record.authorityBrief && (
              <div className="mt-4 rounded-xl border-l-4 border-primary bg-secondary-container/25 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Lightbulb className="h-4 w-4" /> Brief for the authority
                </p>
                <p className="text-[15px] leading-relaxed text-on-surface">
                  {record.authorityBrief}
                </p>
              </div>
            )}
          </section>

          {/* Nexus — linked cases (possible network) */}
          {nexus.length > 0 && (
            <section className="rounded-2xl border border-[#993C1D]/25 bg-[#993C1D]/5 p-5">
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#993C1D]">
                <span className="material-symbols-outlined text-[18px]">hub</span>
                Linked cases · possible network
              </h2>
              <p className="mb-3 text-xs text-on-surface-variant">
                Other reports that share a person, contact, or organisation with
                this one — a potential nexus to build a stronger case.
              </p>
              <div className="flex flex-col gap-2">
                {nexus.map((n) => (
                  <Link
                    key={n.caseId}
                    href={`/dashboard/case/${n.caseId}`}
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 transition-shadow hover:shadow-sm"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                        style={{ background: `${typeColor(n.situationType)}1a`, color: typeColor(n.situationType) }}
                      >
                        {n.situationType}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          n.matchPercent >= 70
                            ? "bg-[#993C1D]/15 text-[#993C1D]"
                            : "bg-amber/15 text-amber"
                        }`}
                      >
                        {n.matchPercent}% match
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-on-surface">{n.summary}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {n.shared.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant"
                        >
                          {s.type}: {s.value}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recorded conversation player */}
          <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Recorded conversation
              </h2>
              {transcript.length > 0 && (
                <button
                  onClick={() =>
                    playingIdx === null ? playFrom(0) : stopPlay()
                  }
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {playingIdx === null ? (
                    <>
                      <Play className="h-3.5 w-3.5" /> Play
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Stop
                    </>
                  )}
                </button>
              )}
            </div>
            {transcript.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No recorded conversation attached to this sample case.
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      t.role === "user"
                        ? "bg-surface-container"
                        : "bg-[#E1F5EE]/60"
                    } ${playingIdx === i ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <span className="mr-2 text-xs font-semibold text-on-surface-variant">
                      {t.role === "user" ? "Reporter" : "NISUP"}
                    </span>
                    {t.content}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: suggested action + contact */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-amber/25 bg-amber/10 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber" />
              <h2 className="font-semibold text-amber">Suggested action</h2>
            </div>
            <p className="text-sm leading-relaxed text-on-surface">
              {suggestAction(record)}
            </p>
          </section>

          <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
              Routing
            </h2>
            <p className="text-sm text-on-surface">
              {record.matchedAuthority ?? "National Anti-Trafficking Helpline"}
            </p>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white">
              <Phone className="h-4 w-4" /> Contact victim
            </button>
            <p className="mt-2 text-center text-xs text-on-surface-variant">
              Only if the reporter consented to contact.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function suggestAction(c: CaseRecord): string {
  if (c.urgency === "High")
    return "High urgency — prioritise a welfare check and coordinate with the matched authority within 24 hours. Confirm the reporter's safety plan before any outreach.";
  if (c.situationType.toLowerCase().includes("child"))
    return "Involve child protection services and verify the location discreetly to avoid alerting the employer.";
  return "Review the evidence, confirm jurisdiction with the matched authority, and update the reporter through NISUP once a case worker is assigned.";
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-on-surface-variant" />
      <div>
        <p className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className="text-sm text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/overview"
      className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
    >
      <ArrowLeft className="h-4 w-4" /> Back to overview
    </Link>
  );
}
