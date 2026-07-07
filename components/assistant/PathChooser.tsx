"use client";

import type { UserType } from "@/lib/types";

// Gentle "how can I help you" menu shown before the first message. It never
// forces a label — the person can also just speak or type — but it gives a
// clear way to jump into the right flow (survivors & witnesses go straight to
// the record/share screen).
const OPTIONS: {
  type: UserType;
  icon: string;
  title: string;
  desc: string;
}[] = [
  {
    type: "victim",
    icon: "volunteer_activism",
    title: "I need help & justice",
    desc: "Something happened to me",
  },
  {
    type: "survivor",
    icon: "record_voice_over",
    title: "I'm a survivor",
    desc: "Share my story to protect others",
  },
  {
    type: "witness",
    icon: "visibility",
    title: "I witnessed something",
    desc: "Report what I saw, with proof",
  },
  {
    type: "at_risk",
    icon: "shield",
    title: "I'm worried about myself",
    desc: "Check if something is wrong",
  },
];

export function PathChooser({
  onChoose,
}: {
  onChoose: (type: UserType) => void;
}) {
  return (
    <div className="mb-8 w-full max-w-md">
      <p className="mb-3 text-center font-label-md text-label-md text-on-surface-variant">
        How can I help you today? You can also just speak or type.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.type}
            onClick={() => onChoose(o.type)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-primary/10 bg-white p-4 text-left shadow-[0_12px_24px_rgba(15,110,86,0.04)] transition-all hover:bg-primary/5 active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined">{o.icon}</span>
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              {o.title}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {o.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
