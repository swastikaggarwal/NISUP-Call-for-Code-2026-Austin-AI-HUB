// Colour + label helpers for situation types, shared by the map legend,
// markers, and charts so everything stays consistent.

export const TYPE_COLORS: Record<string, string> = {
  "Forced labour": "#0f6e56",
  "Labour exploitation": "#0f6e56",
  "Sex trafficking": "#ba7517",
  "Child labour": "#993c1d",
  "Forced marriage": "#3b6bd6",
  "Fake job scam": "#7a4fd6",
};

const FALLBACK = "#6f7a74";

export function typeColor(situationType: string): string {
  return TYPE_COLORS[situationType] ?? FALLBACK;
}

export const URGENCY_STYLES: Record<string, string> = {
  High: "bg-[#993C1D]/10 text-[#993C1D]",
  Medium: "bg-amber/15 text-amber",
  Low: "bg-primary-container/10 text-primary",
};

export const STATUS_STYLES: Record<string, string> = {
  New: "bg-primary-container/10 text-primary",
  "In Review": "bg-amber/15 text-amber",
  "Action Taken": "bg-on-surface/10 text-on-surface-variant",
};
