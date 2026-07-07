"use client";

import { useRouter } from "next/navigation";

// Shared header for the secondary pages: a real Back button + NISUP wordmark.
export function PageHeader({
  title,
  fallback = "/assistant",
}: {
  title?: string;
  fallback?: string;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/40 bg-background/85 px-5 py-4 backdrop-blur-xl">
      <button
        onClick={() => router.push(fallback)}
        className="flex items-center gap-1 rounded-full border border-outline-variant/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>
      {title ? (
        <span className="font-headline-md text-headline-md font-semibold text-on-surface">
          {title}
        </span>
      ) : (
        <span className="text-lg font-bold tracking-wide text-primary">NISUP</span>
      )}
      <span className="w-[76px]" />
    </header>
  );
}
