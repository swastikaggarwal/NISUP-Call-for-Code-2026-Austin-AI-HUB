"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchCases, fetchNexus } from "@/lib/api";
import { typeColor, URGENCY_STYLES } from "@/lib/caseTypes";
import type { CaseRecord, NexusLink } from "@/lib/types";

// Public case "article" — a complete, shareable view of a filed case: headline,
// summary, the person's report, playable voice recordings, and image evidence.
// Reachable at /case/<id or referenceId> so anyone with the link sees the full
// information (recordings, images, etc.).
export default function CaseArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [nexus, setNexus] = useState<NexusLink[]>([]);

  useEffect(() => {
    fetchCases()
      .then((cases) => {
        setRecord(
          cases.find((c) => c.id === params.id || c.referenceId === params.id) ??
            null
        );
      })
      .finally(() => setLoading(false));
    fetchNexus(params.id).then(setNexus);
  }, [params.id]);

  if (loading)
    return (
      <div className="mx-auto max-w-2xl p-8 text-on-surface-variant">Loading…</div>
    );

  if (!record)
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-on-surface-variant">This case could not be found.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-on-primary"
        >
          Go home
        </button>
      </div>
    );

  const images = (record.attachments ?? []).filter((a) => a.kind === "image");
  const audios = (record.attachments ?? []).filter((a) => a.kind === "voice");
  const links = (record.attachments ?? []).filter((a) => a.kind === "link");
  const color = typeColor(record.situationType);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-lowest/80 px-6 py-4 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded-full border border-outline-variant/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <span className="text-lg font-bold tracking-wide text-primary">NISUP</span>
      </header>

      <article className="mx-auto max-w-2xl px-6 py-10">
        {/* Category + urgency */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ background: `${color}1a`, color }}
          >
            {record.situationType}
          </span>
          <span
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              URGENCY_STYLES[record.urgency]
            }`}
          >
            {record.urgency} urgency
          </span>
          <span className="rounded-md bg-surface-container px-3 py-1 text-xs font-semibold uppercase text-on-surface-variant">
            {record.userType.replace("_", " ")}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-headline-lg text-headline-lg leading-tight text-on-surface">
          {record.summary}
        </h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-y border-outline-variant/40 py-4 text-sm text-on-surface-variant">
          <Meta icon="location_on" value={record.location} />
          <Meta icon="group" value={record.peopleInvolved} />
          <Meta icon="event" value={record.dates ?? record.createdAt ?? "Unknown"} />
          <Meta icon="tag" value={record.referenceId ?? record.id} />
        </div>

        {/* AI brief for the authority */}
        {record.authorityBrief && (
          <section className="mt-6 rounded-2xl border-l-4 border-primary bg-secondary-container/25 p-5">
            <h2 className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wide text-primary">
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              Case brief
            </h2>
            <p className="text-body-lg leading-relaxed text-on-surface">
              {record.authorityBrief}
            </p>
          </section>
        )}

        {/* Voice recordings */}
        {audios.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <span className="material-symbols-outlined">graphic_eq</span>
              Voice recording{audios.length > 1 ? "s" : ""}
            </h2>
            <div className="flex flex-col gap-3">
              {audios.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-outline-variant/40 bg-white p-4"
                >
                  <p className="mb-2 font-label-sm text-label-sm text-on-surface-variant">
                    {a.label}
                  </p>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={a.ref} className="w-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* In their words */}
        {record.reportMessage && record.reportMessage !== "Unknown" && (
          <section className="mt-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-primary">
              In their words
            </h2>
            <blockquote
              className="rounded-2xl border-l-4 bg-white p-5 text-body-lg italic leading-relaxed text-on-surface"
              style={{ borderLeftColor: color }}
            >
              &ldquo;{record.reportMessage}&rdquo;
            </blockquote>
          </section>
        )}

        {/* Image evidence */}
        {images.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <span className="material-symbols-outlined">image</span>
              Evidence
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a.id}
                  src={a.ref}
                  alt={a.label}
                  className="h-40 w-full rounded-2xl border border-outline-variant/40 object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Links */}
        {links.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-headline-md text-headline-md text-primary">
              Links
            </h2>
            <ul className="flex flex-col gap-2">
              {links.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.ref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary underline"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Nexus — linked cases */}
        {nexus.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-headline-md text-headline-md text-[#993C1D]">
              <span className="material-symbols-outlined">hub</span>
              Linked cases · possible network
            </h2>
            <p className="mb-3 font-body-md text-on-surface-variant">
              Other reports that name the same person, contact, or organisation.
            </p>
            <div className="flex flex-col gap-3">
              {nexus.map((n) => (
                <Link
                  key={n.caseId}
                  href={`/case/${n.referenceId ?? n.caseId}`}
                  className="rounded-2xl border border-[#993C1D]/20 bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                      style={{ background: `${typeColor(n.situationType)}1a`, color: typeColor(n.situationType) }}
                    >
                      {n.situationType}
                    </span>
                    <span className="rounded-full bg-[#993C1D]/10 px-2 py-0.5 text-[10px] font-bold text-[#993C1D]">
                      {n.matchPercent}% match
                    </span>
                  </div>
                  <p className="line-clamp-2 font-body-md text-on-surface">{n.summary}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.shared.map((s, i) => (
                      <span key={i} className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">
                        {s.type}: {s.value}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Routing footer — a private note is NOT routed anywhere */}
        {record.isNote ? (
          <footer className="mt-10 rounded-2xl bg-surface-container p-5">
            <p className="flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Private note
            </p>
            <p className="mt-2 font-body-md text-on-surface">
              This was saved as a personal note — it has not been sent to any
              authority and is visible only through this link. If things change,
              you can turn it into a report from the assistant any time.
            </p>
          </footer>
        ) : (
          <footer className="mt-10 rounded-2xl bg-secondary-container/30 p-5">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              Routed to
            </p>
            <p className="font-body-lg font-medium text-primary">
              {record.matchedAuthority ?? "National Anti-Trafficking Helpline"}
            </p>
            <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
              Shared through NISUP. Details are provided by the reporter and
              handled with care.
            </p>
          </footer>
        )}
      </article>
    </div>
  );
}

function Meta({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {value}
    </span>
  );
}
