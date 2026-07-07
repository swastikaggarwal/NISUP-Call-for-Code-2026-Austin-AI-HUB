import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/groq";
import { classificationPrompt } from "@/lib/prompts";
import { getCases } from "@/lib/store";
import type { CaseRecord, Classification } from "@/lib/types";

// Deterministic grouping fallback so the dashboard always has something to show
// even if the LLM call fails.
function groupLocally(cases: CaseRecord[]): Classification {
  const map = new Map<string, string[]>();
  for (const c of cases) {
    const key = c.situationType || "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c.id);
  }
  return {
    groups: [...map.entries()].map(([situationType, caseIds]) => ({
      situationType,
      count: caseIds.length,
      caseIds,
    })),
    patterns: [],
  };
}

// POST /api/classify  { cases? } -> { groups, patterns }
// If cases are not supplied, classify everything currently in the store.
export async function POST(request: Request) {
  let cases: CaseRecord[] = [];
  try {
    const body = (await request.json().catch(() => ({}))) as {
      cases?: CaseRecord[];
    };
    // Private notes are never analysed for authorities.
    cases = (body.cases && body.cases.length ? body.cases : getCases()).filter(
      (c) => !c.isNote
    );

    // Trim to the fields that matter for classification to keep the prompt lean.
    const lean = cases.map((c) => ({
      id: c.id,
      situationType: c.situationType,
      location: c.location,
      peopleInvolved: c.peopleInvolved,
      dates: c.dates ?? c.createdAt,
      urgency: c.urgency,
    }));

    const raw = await complete(
      [{ role: "system", content: classificationPrompt(JSON.stringify(lean)) }],
      { temperature: 0.2, maxTokens: 700 }
    );

    const parsed = extractJson<Classification>(raw, groupLocally(cases));
    // Guarantee shape.
    if (!parsed.groups) parsed.groups = groupLocally(cases).groups;
    if (!parsed.patterns) parsed.patterns = [];
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("/api/classify error", err);
    return NextResponse.json(groupLocally(cases), { status: 200 });
  }
}
