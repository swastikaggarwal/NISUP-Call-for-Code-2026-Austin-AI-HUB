"use client";

import type { Match, NexusLink } from "@/lib/types";

// Proactive "I've seen a related case" card — shown when the person's report
// shares a person/contact/org with an existing case (a nexus). Lets them open
// the related case article.
export function NexusCard({ links }: { links: NexusLink[] }) {
  if (!links.length) return null;
  const top = links[0];
  return (
    <div className="w-full rounded-[24px] border border-primary/20 bg-[#E1F5EE] p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            hub
          </span>
          I&apos;ve seen a related case
        </span>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-on-primary">
          {top.matchPercent}% match
        </span>
      </div>
      <p className="mb-2 font-body-md leading-relaxed text-on-surface">
        What you&apos;re describing strongly matches an earlier report
        {top.shared[0] ? ` — ${top.shared[0].value}` : ""}. It may be the same
        person. Would you like to see what happened to that case, or check if it&apos;s
        the same individual? Together, these reports build a stronger case.
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {top.shared.slice(0, 4).map((s, i) => (
          <span
            key={i}
            className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-on-surface-variant"
          >
            {s.type}: {s.value}
          </span>
        ))}
      </div>
      <a
        href={`/case/${top.referenceId ?? top.caseId}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-label-md text-label-md text-on-primary active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">article</span>
        See the related case
      </a>
    </div>
  );
}

// Amber "survivor / whistleblower" empowerment card — ported from Stitch
// "survivor_whistleblower_moment". Anonymous is ON by default.
export function SurvivorCard({
  anonymous,
  onToggleAnonymous,
  onShareStory,
}: {
  anonymous: boolean;
  onToggleAnonymous: (v: boolean) => void;
  onShareStory: () => void;
}) {
  return (
    <div className="my-2 flex flex-col gap-5 rounded-2xl border-l-4 border-amber bg-white p-6 shadow-[0_20px_40px_rgba(186,117,23,0.08)]">
      <div className="space-y-2">
        <h2 className="font-headline-md text-headline-md font-bold leading-tight text-amber">
          Your voice can protect others
        </h2>
        <p className="font-body-md text-on-surface-variant opacity-90">
          What you share can become an alert that helps someone avoid the same
          harm. Share only what you&apos;re comfortable with.
        </p>
      </div>

      {/* Attachment options */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "mic", label: "Voice note" },
          { icon: "photo", label: "Photo" },
          { icon: "description", label: "Add details" },
        ].map((o) => (
          <button
            key={o.label}
            onClick={onShareStory}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low p-3 transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-amber transition-transform group-active:scale-90">
              {o.icon}
            </span>
            <span className="font-label-md text-[11px] text-on-surface-variant">
              {o.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <button
          onClick={onShareStory}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-amber font-label-md text-white shadow-lg shadow-amber/20 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">share</span>
          Share to help others
        </button>

        {/* Anonymous toggle */}
        <button
          onClick={() => onToggleAnonymous(!anonymous)}
          className="flex items-center justify-between rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-outline"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              security
            </span>
            <span className="font-label-md text-on-surface">Stay anonymous</span>
          </div>
          <div
            className={`relative flex h-5 w-10 items-center rounded-full px-0.5 ${
              anonymous ? "bg-amber" : "bg-outline-variant"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                anonymous ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

// Witness card — shown when the person reports witnessing something (e.g. child
// labour). Offers to capture evidence and route the report to the right authority.
export function WitnessCard({
  onAddEvidence,
  onReport,
}: {
  onAddEvidence: () => void;
  onReport: () => void;
}) {
  return (
    <div className="my-2 flex flex-col gap-5 rounded-2xl border-l-4 border-primary-container bg-white p-6 shadow-[0_20px_40px_rgba(15,110,86,0.08)]">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            visibility
          </span>
          <h2 className="font-headline-md text-headline-md font-bold leading-tight">
            Thank you for speaking up
          </h2>
        </div>
        <p className="font-body-md text-on-surface-variant opacity-90">
          What you witnessed can protect someone who can&apos;t ask for help. Add
          anything you have, and I can route it to the right authority.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onAddEvidence}
          className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-low p-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-primary">
            add_a_photo
          </span>
          Add photo / proof
        </button>
        <button
          onClick={onReport}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-container p-3 font-label-md text-label-md text-on-primary transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">send</span>
          Report it
        </button>
      </div>
    </div>
  );
}

// Respectful "Safety Alert" card surfacing a related alert / similar case —
// ported from Stitch "alert_surfaced".
export function MatchCard({
  kind,
  matches,
}: {
  kind: "alert" | "story" | "authority";
  matches: Match[];
}) {
  if (!matches.length) return null;

  const header =
    kind === "alert"
      ? { icon: "shield", label: "Safety Alert" }
      : kind === "story"
        ? { icon: "diversity_1", label: "You're not alone" }
        : { icon: "verified_user", label: "Who can help you" };

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="ambient-shadow flex w-full max-w-[95%] flex-col gap-4 rounded-[24px] rounded-tl-none border border-amber/20 bg-white p-6">
        <div className="flex items-center gap-2 text-amber">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {header.icon}
          </span>
          <span className="font-label-md text-label-md uppercase tracking-wider">
            {header.label}
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {matches.map((m, i) => (
            <li key={i} className="flex flex-col gap-1">
              <p className="font-body-md font-semibold text-on-surface">
                {m.name}
              </p>
              <p className="text-body-md italic leading-relaxed text-on-surface-variant">
                &ldquo;{m.reason}&rdquo;
              </p>
            </li>
          ))}
        </ul>

        <div className="h-px w-full bg-outline-variant/30" />

        <div className="flex gap-3">
          <button className="rounded-full bg-surface-container px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-on-secondary-container">
            This helped me
          </button>
          <button className="rounded-full bg-surface-container px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high">
            Not relevant
          </button>
        </div>
      </div>
    </div>
  );
}
