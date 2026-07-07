"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import type { LanguageCode } from "@/lib/types";

// Welcome screen — ported 1:1 from Stitch "welcome_to_nisup/code.html".
// Quick Exit removed per request; language row is interactive.
export default function WelcomePage() {
  const router = useRouter();
  const { language, setLanguageByCode, languages } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col font-body-md text-on-background">
      <main className="relative flex flex-grow flex-col items-center justify-center px-container-padding-mobile text-center">
        {/* Background atmospheric orbs */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="orb-pulse absolute h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div
            className="orb-pulse absolute h-[300px] w-[300px] rounded-full bg-secondary/5 blur-2xl"
            style={{ animationDelay: "-2s" }}
          />
        </div>

        {/* Content */}
        <div className="fade-in flex w-full max-w-md flex-col items-center gap-stack-gap-lg">
          <div className="flex flex-col items-center gap-stack-gap-sm">
            <h1 className="mb-1 text-2xl font-bold tracking-wide text-primary">
              NISUP
            </h1>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              Welcome to NISUP
            </h1>
            <p className="max-w-[280px] font-body-lg text-body-lg text-on-surface-variant">
              A safe voice to talk to, whenever you need.
            </p>
          </div>

          {/* Action area */}
          <div className="flex w-full flex-col items-center gap-stack-gap-md">
            <button
              onClick={() => router.push("/assistant")}
              className="ambient-shadow flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-primary-container font-label-md text-label-md text-on-primary transition-all duration-200 hover:opacity-90 active:scale-95"
            >
              Begin
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <div className="flex items-center gap-2 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span className="font-label-sm text-label-sm">
                You can speak or type. You&apos;re in control.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom language selection (quiet row) */}
      <footer className="flex w-full flex-col items-center gap-stack-gap-md px-container-padding-mobile py-stack-gap-lg">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {languages.map((l) => (
            <button
              key={l.code}
              lang={l.code}
              onClick={() => setLanguageByCode(l.code as LanguageCode)}
              className={
                l.code === language.code
                  ? "font-label-sm text-label-sm font-bold text-primary transition-opacity hover:opacity-80"
                  : "font-label-sm text-label-sm text-on-surface-variant transition-opacity hover:opacity-80"
              }
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 opacity-40">
          <a
            className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface hover:underline"
            href="#"
          >
            Privacy
          </a>
          <a
            className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface hover:underline"
            href="#"
          >
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
