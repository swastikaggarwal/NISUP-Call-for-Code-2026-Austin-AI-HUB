"use client";

import { useRef, useState } from "react";
import { useCase } from "@/context/CaseContext";
import { readFileAsDataURL } from "@/lib/utils";
import type { Evidence } from "@/lib/types";

// Slide-up "Share evidence" sheet — ported from Stitch "share_evidence".
// MVP: files become object URLs / data refs in memory only.
// TODO: upload + encrypt attachments; never store raw files client-side in prod.
export function EvidenceSheet({ onClose }: { onClose: () => void }) {
  const { addAttachment } = useCase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const options: {
    kind: Evidence["kind"];
    label: string;
    icon: string;
    accept?: string;
  }[] = [
    { kind: "image", label: "Photo or image", icon: "image", accept: "image/*" },
    { kind: "voice", label: "Voice note", icon: "mic", accept: "audio/*" },
    { kind: "video", label: "Screen recording / video", icon: "videocam", accept: "video/*" },
    { kind: "link", label: "Add a link", icon: "link" },
  ];

  const handlePick = (opt: (typeof options)[number]) => {
    setSelected(opt.kind);
    if (opt.kind === "link") {
      const url = window.prompt("Paste the link you want to share as evidence:");
      if (url) addAttachment({ kind: "link", label: url, ref: url });
      return;
    }
    fileRef.current!.accept = opt.accept ?? "*/*";
    fileRef.current!.dataset.kind = opt.kind;
    fileRef.current!.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = (e.target.dataset.kind as Evidence["kind"]) ?? "file";
    // Store as a data URL so it persists into the case record + article page.
    const ref = await readFileAsDataURL(file);
    addAttachment({ kind, label: file.name, ref });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up relative mx-auto flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[40px] bg-[#FAFAF7] shadow-[0_-12px_60px_rgba(15,110,86,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull handle */}
        <div className="flex w-full justify-center pb-2 pt-4">
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/50" />
        </div>

        {/* Close (modal only — not Quick Exit) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 flex items-center gap-1 rounded-full border border-outline-variant/40 bg-white p-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
          Close
        </button>

        <div className="flex flex-col gap-stack-gap-md overflow-y-auto px-container-padding-mobile pb-8 pt-4">
          <div className="space-y-2">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary">
              Share anything that helps.
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Your privacy is our priority. You decide if this is ever sent to an
              authority.
            </p>
          </div>

          {/* 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const active = selected === opt.kind;
              return (
                <button
                  key={opt.kind}
                  onClick={() => handlePick(opt)}
                  className={`flex flex-col items-center justify-center gap-3 rounded-[32px] border border-primary/5 bg-white p-6 text-center shadow-[0_12px_24px_rgba(15,110,86,0.04)] transition-all duration-200 hover:bg-primary/5 active:scale-95 ${
                    active ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      active
                        ? "bg-primary text-white"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {opt.icon}
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Privacy reassurance */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span
              className="material-symbols-outlined text-lg text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_lock
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Only share what you&apos;re comfortable with. This stays private.
            </p>
          </div>

          {/* Done */}
          <div className="mt-4">
            <button
              onClick={onClose}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary font-label-md text-label-md text-white shadow-[0_16px_32px_rgba(0,84,64,0.15)] transition-transform duration-200 active:scale-[0.98]"
            >
              Done
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </button>
          </div>
        </div>

        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
