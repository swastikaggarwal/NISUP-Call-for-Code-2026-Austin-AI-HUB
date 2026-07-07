import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/groq";
import { extractionPrompt } from "@/lib/prompts";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/languages";
import type { CaseRecord, ChatMessage, LanguageCode } from "@/lib/types";

// A safe empty case used as the fallback if extraction fails.
const EMPTY_CASE: Omit<CaseRecord, "id"> = {
  userType: "unknown",
  situationType: "Unknown",
  summary: "Unknown",
  location: "Unknown",
  peopleInvolved: "Unknown",
  evidence: "Unknown",
  dates: "Unknown",
  urgency: "Low",
  reportMessage: "Unknown",
};

// POST /api/extract  { messages, language } -> case JSON
export async function POST(request: Request) {
  try {
    const { messages, language } = (await request.json()) as {
      messages: ChatMessage[];
      language?: LanguageCode;
    };
    const lang = LANGUAGES.find((l) => l.code === language) ?? DEFAULT_LANGUAGE;

    // Feed the conversation as a single readable transcript.
    const transcript = (messages ?? [])
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "User" : "NISUP"}: ${m.content}`)
      .join("\n");

    const raw = await complete(
      [
        { role: "system", content: extractionPrompt(lang) },
        { role: "user", content: `Conversation:\n${transcript}` },
      ],
      { temperature: 0.2, maxTokens: 700 }
    );

    const parsed = extractJson<Omit<CaseRecord, "id">>(raw, EMPTY_CASE);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("/api/extract error", err);
    return NextResponse.json(EMPTY_CASE, { status: 200 });
  }
}
