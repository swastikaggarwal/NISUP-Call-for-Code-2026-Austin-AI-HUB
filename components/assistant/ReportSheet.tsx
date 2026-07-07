"use client";

import { useEffect, useState } from "react";
import { useCase } from "@/context/CaseContext";
import { useLanguage } from "@/context/LanguageContext";
import { extractCase, findMatches, fileReport } from "@/lib/api";
import type { CaseRecord } from "@/lib/types";

type Phase = "loading" | "review" | "sending" | "done" | "error";

// File-a-complaint flow ("Complaint Draft" bento) — ported from Stitch
// "file_a_complaint". Extracts a structured report from the conversation, lets
// the user review/edit, matches an authority, "sends", shows a reference ID.
export function ReportSheet({ onClose }: { onClose: () => void }) {
  const { messages, attachments } = useCase();
  const { language } = useLanguage();
  const [phase, setPhase] = useState<Phase>("loading");
  const [record, setRecord] = useState<Omit<CaseRecord, "id"> | null>(null);
  const [authority, setAuthority] = useState("");
  const [result, setResult] = useState<{ referenceId: string; routedTo: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const extracted = await extractCase(messages, language.code);
        if (cancelled) return;
        setRecord(extracted);
        const matches = await findMatches(
          "authority",
          extracted.situationType,
          extracted.location
        );
        if (cancelled) return;
        setAuthority(matches[0]?.name ?? "National Anti-Trafficking Helpline");
        setPhase("review");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof CaseRecord, value: string) =>
    setRecord((r) => (r ? { ...r, [field]: value } : r));

  const handleSend = async () => {
    if (!record) return;
    setPhase("sending");
    try {
      const res = await fileReport({
        ...record,
        matchedAuthority: authority,
        transcript: messages,
        attachments,
        evidence:
          record.evidence && record.evidence !== "Unknown"
            ? record.evidence
            : attachments.map((a) => `${a.kind}: ${a.label}`).join(", ") ||
              "None provided",
      });
      setResult(res);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-[40px] bg-[#FAFAF7] p-6 pb-10 shadow-[0_-12px_60px_rgba(15,110,86,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull handle */}
        <div className="mb-4 flex w-full justify-center">
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/50" />
        </div>

        {/* Assistant intro bubble */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span
              className="material-symbols-outlined text-xl text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <div className="max-w-[85%] rounded-b-2xl rounded-tr-2xl border border-surface-container-high bg-white p-5 shadow-[0_10px_30px_rgba(15,110,86,0.04)]">
            <p className="font-body-md leading-relaxed text-on-surface">
              I&apos;ve organized the details you shared. Please review the draft
              below — you can edit anything. We&apos;ll send it only when you&apos;re
              ready.
            </p>
          </div>
        </div>

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">
              progress_activity
            </span>
            <p>Preparing your complaint draft from our conversation…</p>
          </div>
        )}

        {phase === "review" && record && (
          <>
            <section className="space-y-6 rounded-3xl border border-surface-container bg-white p-6 shadow-[0_20px_40px_rgba(15,110,86,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold text-primary">
                  Complaint Draft
                </h2>
                <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-xs uppercase tracking-wider text-on-secondary-container">
                  Ready to Review
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <BentoField label="Incident Type" value={record.situationType} onChange={(v) => update("situationType", v)} />
                <BentoField label="Location" value={record.location} onChange={(v) => update("location", v)} />
                <BentoField label="Urgency" value={record.urgency} onChange={(v) => update("urgency", v)} />
                <BentoField label="People Involved" value={record.peopleInvolved} onChange={(v) => update("peopleInvolved", v)} />
              </div>

              <BentoField label="Summary" value={record.summary} onChange={(v) => update("summary", v)} textarea />
              <BentoField label="Report Message (to the authority)" value={record.reportMessage} onChange={(v) => update("reportMessage", v)} textarea />

              {/* Attached evidence */}
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
                <p className="mb-2 font-label-sm uppercase tracking-tighter text-on-surface-variant">
                  Attached Evidence
                </p>
                <div className="flex flex-wrap gap-3">
                  {attachments.map((a) => (
                    <div
                      key={a.id}
                      className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-surface-container-high bg-white shadow-sm"
                      title={a.label}
                    >
                      <span className="material-symbols-outlined text-primary">
                        {a.kind === "image"
                          ? "image"
                          : a.kind === "voice"
                            ? "mic"
                            : a.kind === "video"
                              ? "videocam"
                              : "link"}
                      </span>
                    </div>
                  ))}
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant/40">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                </div>
              </div>

              {/* Routing */}
              <div className="rounded-2xl border border-primary/10 bg-secondary-container/30 p-4">
                <p className="mb-1 font-label-sm uppercase tracking-tighter text-on-surface-variant">
                  Routing to
                </p>
                <p className="font-body-lg font-medium text-primary">{authority}</p>
              </div>
            </section>

            <button
              onClick={handleSend}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-on-primary shadow-[0_10px_20px_rgba(0,84,64,0.2)] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Send this report
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="flex items-center justify-center gap-2 py-4">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                encrypted
              </span>
              <p className="text-center font-label-sm text-on-surface-variant">
                Your report is encrypted and shared only when you tap Send.
              </p>
            </div>
          </>
        )}

        {phase === "sending" && (
          <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">
              progress_activity
            </span>
            <p>Sending securely to {authority}…</p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span
              className="material-symbols-outlined text-5xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Report sent
            </h4>
            <p className="max-w-xs font-body-md text-on-surface-variant">
              Your report has been routed to <b>{result.routedTo}</b>. Keep your
              reference number safe to follow up.
            </p>
            <div className="mt-2 rounded-2xl bg-surface-container-low px-6 py-3">
              <p className="font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                Reference ID
              </p>
              <p className="text-2xl font-bold tracking-wider text-primary">
                {result.referenceId}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`/track/${result.referenceId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
              >
                <span className="material-symbols-outlined">timeline</span>
                Track this case
              </a>
              <a
                href={`/case/${result.referenceId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-semibold text-primary"
              >
                <span className="material-symbols-outlined">article</span>
                View the case article
              </a>
            </div>
            <button onClick={onClose} className="mt-1 text-on-surface-variant underline">
              Done
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-on-surface-variant">
            <p>
              I couldn&apos;t prepare the report just now. Please try again in a
              moment — your conversation is safe.
            </p>
            <button
              onClick={onClose}
              className="rounded-full bg-surface-container px-6 py-2.5 font-medium text-on-surface"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BentoField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-4">
      <p className="mb-1 font-label-sm uppercase tracking-tighter text-on-surface-variant">
        {label}
      </p>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-none bg-transparent font-body-md text-on-surface outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-body-lg font-medium text-on-surface outline-none"
        />
      )}
    </div>
  );
}
