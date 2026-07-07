"use client";

import { useRef, useState } from "react";
import { useCase } from "@/context/CaseContext";
import { useLanguage } from "@/context/LanguageContext";
import { extractCase, fileReport } from "@/lib/api";
import { readFileAsDataURL } from "@/lib/utils";
import type { UserType } from "@/lib/types";

type Phase = "compose" | "publishing" | "done" | "error";

// "Share your story" flow for survivors & witnesses: record voice (auto-saved),
// attach photos/screenshots (saved), add written details, then publish. The
// result is a public case article at /case/<referenceId> with the recording and
// images embedded so anyone with the link sees the complete information.
export function ShareStorySheet({
  userType,
  onClose,
}: {
  userType: UserType;
  onClose: () => void;
}) {
  const { messages, attachments, addAttachment } = useCase();
  const { language } = useLanguage();
  const [phase, setPhase] = useState<Phase>("compose");
  const [details, setDetails] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [result, setResult] = useState<{ referenceId: string; routedTo: string } | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  // ── audio recording ──
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () =>
          addAttachment({
            kind: "voice",
            label: `Voice recording (${secondsRef.current}s)`,
            ref: reader.result as string,
          });
        reader.readAsDataURL(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSeconds(0);
      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setRecSeconds(secondsRef.current);
      }, 1000);
    } catch {
      alert("Please allow microphone access to record your voice.");
    }
  };
  const stopRec = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setRecording(false);
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ref = await readFileAsDataURL(file);
    addAttachment({ kind: "image", label: file.name, ref });
  };

  const publish = async () => {
    setPhase("publishing");
    try {
      // Enrich from the conversation if there is one; otherwise use the details.
      const rec = await extractCase(messages, language.code).catch(() => null);
      const situationType =
        rec && rec.situationType !== "Unknown"
          ? rec.situationType
          : userType === "survivor"
            ? "Survivor testimony"
            : "Witness report";
      const summary =
        rec && rec.summary !== "Unknown"
          ? rec.summary
          : details || "Shared via the NISUP story flow.";

      const res = await fileReport({
        userType,
        situationType,
        summary,
        location: rec?.location ?? "Unknown",
        peopleInvolved: anonymous ? "Anonymous reporter" : rec?.peopleInvolved ?? "Unknown",
        evidence: attachments.map((a) => `${a.kind}: ${a.label}`).join(", ") || "None",
        dates: new Date().toISOString().slice(0, 10),
        urgency: rec?.urgency ?? "Medium",
        reportMessage: details || rec?.reportMessage || summary,
        contacts: rec?.contacts,
        authorityBrief: rec?.authorityBrief,
        attachments,
        transcript: messages,
      });
      setResult(res);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  };

  const isSurvivor = userType === "survivor";
  const accent = isSurvivor ? "text-amber" : "text-primary";
  const mmss = `${String(Math.floor(recSeconds / 60)).padStart(2, "0")}:${String(recSeconds % 60).padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 z-[66] flex items-end justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[40px] bg-[#FAFAF7] p-6 pb-10 shadow-[0_-12px_60px_rgba(15,110,86,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex w-full justify-center">
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/50" />
        </div>

        {phase === "compose" && (
          <>
            <h1 className={`font-headline-lg-mobile text-headline-lg-mobile tracking-tight ${accent}`}>
              {isSurvivor ? "Your voice can protect others" : "Report what you witnessed"}
            </h1>
            <p className="mt-2 font-body-md text-on-surface-variant">
              Record your voice, add photos or screenshots, and any details. When
              you publish, it becomes a case others can learn from. Share only
              what you&apos;re comfortable with.
            </p>

            {/* Record voice */}
            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/40 bg-white p-5">
              <p className="font-label-md text-label-md text-on-surface-variant">
                {recording ? `Recording ${mmss}` : "Record your voice"}
              </p>
              <button
                onClick={recording ? stopRec : startRec}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg active:scale-95 ${
                  recording ? "bg-[#993C1D] animate-pulse" : "bg-primary-container"
                }`}
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {recording ? "stop" : "mic"}
                </span>
              </button>
              <p className="font-label-sm text-label-sm text-on-surface-variant/70">
                {recording ? "Tap to stop — it saves automatically" : "Tap to start"}
              </p>
            </div>

            {/* Add image */}
            <button
              onClick={() => imgRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant bg-white py-4 font-label-md text-label-md text-on-surface-variant hover:border-primary/40"
            >
              <span className="material-symbols-outlined text-primary">add_a_photo</span>
              Add a photo or screenshot
            </button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={addImage} />

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/40 bg-white"
                    title={a.label}
                  >
                    {a.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.ref} alt={a.label} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary">
                        {a.kind === "voice" ? "graphic_eq" : "link"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Details */}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Add anything you want people to know (optional)…"
              className="mt-4 w-full resize-none rounded-2xl border border-outline-variant/40 bg-white p-4 font-body-md text-on-surface outline-none focus:border-primary/50"
            />

            {/* Anonymous toggle */}
            <button
              onClick={() => setAnonymous((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-full border border-outline-variant bg-white px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>
                  security
                </span>
                <span className="font-label-md text-on-surface">Stay anonymous</span>
              </div>
              <div className={`relative flex h-5 w-10 items-center rounded-full px-0.5 ${anonymous ? "bg-amber" : "bg-outline-variant"}`}>
                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${anonymous ? "translate-x-5" : ""}`} />
              </div>
            </button>

            <button
              onClick={publish}
              disabled={attachments.length === 0 && !details.trim()}
              className={`mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full font-label-md text-white shadow-lg active:scale-[0.98] disabled:opacity-40 ${
                isSurvivor ? "bg-amber" : "bg-primary"
              }`}
            >
              <span className="material-symbols-outlined">publish</span>
              Publish my story
            </button>
          </>
        )}

        {phase === "publishing" && (
          <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p>Saving your recording and images, and preparing the case…</p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <h4 className="font-headline-md text-headline-md text-on-surface">Published</h4>
            <p className="max-w-xs font-body-md text-on-surface-variant">
              Thank you for your courage. Your case is saved with your recording and
              images, and routed to <b>{result.routedTo}</b>.
            </p>
            <div className="mt-2 flex flex-col gap-2">
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
            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              Reference: <b>{result.referenceId}</b>
            </p>
            <button onClick={onClose} className="mt-2 text-on-surface-variant underline">
              Close
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-on-surface-variant">
            <p>Something went wrong publishing. Your recording is still safe — please try again.</p>
            <button onClick={() => setPhase("compose")} className="rounded-full bg-surface-container px-6 py-2.5 font-medium text-on-surface">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
