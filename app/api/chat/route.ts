import { NextResponse } from "next/server";
import { complete } from "@/lib/groq";
import { mainAssistantPrompt, triageInstruction } from "@/lib/prompts";
import { buildContext } from "@/lib/rag";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/languages";
import type { ChatMessage, LanguageCode, RiskBand } from "@/lib/types";

// POST /api/chat  { messages, language } -> { reply }
// Main conversational turn. The GROQ_API_KEY is read server-side only.
export async function POST(request: Request) {
  try {
    const { messages, language, riskBand, redFlags } = (await request.json()) as {
      messages: ChatMessage[];
      language?: LanguageCode;
      riskBand?: RiskBand;
      redFlags?: string[];
    };

    const lang =
      LANGUAGES.find((l) => l.code === language) ?? DEFAULT_LANGUAGE;

    const system: ChatMessage = {
      role: "system",
      content: mainAssistantPrompt(lang),
    };

    // RAG: retrieve relevant case examples + guidance for the latest user turn
    // (plus a little recent context) and inject as an extra system message.
    const recentUser = (messages ?? [])
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.content)
      .join(" ");
    const context = buildContext(recentUser, 3);
    const grounding: ChatMessage[] = context
      ? [{ role: "system", content: context }]
      : [];

    // Flag-triage steering: green concludes, amber clarifies, red offers firmly.
    const triage = triageInstruction(riskBand, redFlags);
    if (triage) grounding.push({ role: "system", content: triage });

    const reply = await complete(
      [system, ...grounding, ...(messages ?? [])],
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("/api/chat error", err);
    // Graceful, trauma-informed fallback so the UI never dead-ends.
    return NextResponse.json(
      {
        reply:
          "I'm here with you. I'm having a little trouble responding right now — please take your time, and try once more when you're ready.",
        error: true,
      },
      { status: 200 }
    );
  }
}
