"use client";

import { PageHeader } from "@/components/PageHeader";

// Privacy & safety information.
export default function PrivacyPage() {
  const points = [
    {
      icon: "lock",
      title: "You control what's shared",
      body: "Nothing is sent to an authority unless you choose to send it. Your conversation stays with you until then.",
    },
    {
      icon: "visibility_off",
      title: "You can stay anonymous",
      body: "When you share a story or report, anonymity is on by default. You decide whether to include your identity.",
    },
    {
      icon: "mic",
      title: "Recordings & images",
      body: "Voice notes and photos you add are attached only to your case, so they can support your report when you're ready.",
    },
    {
      icon: "emergency",
      title: "In immediate danger",
      body: "Use Emergency help or your local emergency number. NISUP is a support tool, not a replacement for emergency services.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Privacy & safety" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <p className="mb-6 font-body-lg text-body-lg text-on-surface-variant">
          NISUP is built to be a safe space. Here&apos;s how we protect you.
        </p>
        <div className="flex flex-col gap-4">
          {points.map((p) => (
            <div
              key={p.title}
              className="flex gap-4 rounded-2xl border border-outline-variant/40 bg-white p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined">{p.icon}</span>
              </span>
              <div>
                <h3 className="font-body-md font-semibold text-on-surface">
                  {p.title}
                </h3>
                <p className="mt-1 font-body-md text-on-surface-variant">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
