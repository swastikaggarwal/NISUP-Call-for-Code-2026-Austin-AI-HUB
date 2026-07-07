import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/groq";
import { matcherPrompt } from "@/lib/prompts";
import type { Match } from "@/lib/types";
import authorities from "@/data/authorities.json";
import stories from "@/data/survivor-stories.json";
import alerts from "@/data/alerts.json";

// LLM-as-retriever matching. We send the relevant JSON to Groq and let it pick.
// TODO: upgrade to vector embeddings + a real vector DB for scale.

type Kind = "authority" | "story" | "alert";

function dataFor(kind: Kind) {
  if (kind === "authority") return authorities;
  if (kind === "story") return stories;
  return alerts;
}

// POST /api/match  { kind, situationType, location } -> Match[]
export async function POST(request: Request) {
  try {
    const { kind, situationType, location } = (await request.json()) as {
      kind: Kind;
      situationType?: string;
      location?: string;
    };

    const data = dataFor(kind ?? "authority");
    const raw = await complete(
      [
        {
          role: "system",
          content: matcherPrompt(
            kind ?? "authority",
            situationType || "Unknown",
            location || "Unknown",
            JSON.stringify(data)
          ),
        },
      ],
      { temperature: 0.2, maxTokens: 400 }
    );

    const matches = extractJson<Match[]>(raw, []);
    return NextResponse.json({ matches: Array.isArray(matches) ? matches : [] });
  } catch (err) {
    console.error("/api/match error", err);
    return NextResponse.json({ matches: [] }, { status: 200 });
  }
}
