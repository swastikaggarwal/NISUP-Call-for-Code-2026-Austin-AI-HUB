// Thin client-side fetch helpers for the API routes. Keeps components tidy.
import type {
  CaseRecord,
  ChatMessage,
  Classification,
  LanguageCode,
  Match,
  NexusLink,
  PatternAlert,
  RiskBand,
} from "./types";

export async function sendChat(
  messages: ChatMessage[],
  language: LanguageCode,
  triage?: { riskBand?: RiskBand; redFlags?: string[] }
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      language,
      riskBand: triage?.riskBand,
      redFlags: triage?.redFlags,
    }),
  });
  const data = await res.json();
  return data.reply as string;
}

export async function extractCase(
  messages: ChatMessage[],
  language: LanguageCode
): Promise<Omit<CaseRecord, "id">> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language }),
  });
  return (await res.json()) as Omit<CaseRecord, "id">;
}

export async function findMatches(
  kind: "authority" | "story" | "alert",
  situationType: string,
  location: string
): Promise<Match[]> {
  const res = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, situationType, location }),
  });
  const data = await res.json();
  return (data.matches ?? []) as Match[];
}

export async function fileReport(
  caseRecord: Partial<CaseRecord>
): Promise<{ referenceId: string; routedTo: string }> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseRecord }),
  });
  return await res.json();
}

export async function fetchCases(): Promise<CaseRecord[]> {
  // Resilient: a transient failure (e.g. server hot-reloading during a poll)
  // resolves to an empty list instead of throwing an unhandled rejection.
  try {
    const res = await fetch("/api/cases", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.cases ?? []) as CaseRecord[];
  } catch {
    return [];
  }
}

// Authority updates a case status (persisted, live-synced to the tracking page).
export async function updateStatus(
  id: string,
  status: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/case-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Nexus for a stored case (dashboard / article).
export async function fetchNexus(id: string): Promise<NexusLink[]> {
  try {
    const res = await fetch(`/api/nexus?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return ((await res.json()).links ?? []) as NexusLink[];
  } catch {
    return [];
  }
}

// Cross-case pattern alerts for the authority dashboard.
export async function fetchPatterns(): Promise<PatternAlert[]> {
  try {
    const res = await fetch("/api/patterns", { cache: "no-store" });
    if (!res.ok) return [];
    return ((await res.json()).alerts ?? []) as PatternAlert[];
  } catch {
    return [];
  }
}

// Nexus for an in-progress conversation (proactive chat surfacing).
export async function findNexusLive(
  caseRecord: Partial<CaseRecord>
): Promise<NexusLink[]> {
  try {
    const res = await fetch("/api/nexus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseRecord }),
    });
    if (!res.ok) return [];
    return ((await res.json()).links ?? []) as NexusLink[];
  } catch {
    return [];
  }
}

export async function classifyCases(
  cases?: CaseRecord[]
): Promise<Classification> {
  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cases }),
  });
  return (await res.json()) as Classification;
}
