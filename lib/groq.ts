import Groq from "groq-sdk";
import type { ChatMessage } from "./types";

// Server-only Groq client. The key is read from the environment and is NEVER
// exposed to the browser — every call here happens inside an API route.
export const GROQ_MODEL = "llama-3.3-70b-versatile";

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Copy .env.example to .env.local and add your free key from https://console.groq.com"
    );
  }
  if (!client) client = new Groq({ apiKey });
  return client;
}

interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

// Core completion helper. Returns the assistant's text.
export async function complete(
  messages: ChatMessage[],
  { temperature = 0.7, maxTokens = 900 }: CompletionOptions = {}
): Promise<string> {
  const groq = getClient();
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

// Groq sometimes wraps JSON in ```json fences or adds stray prose. This strips
// fences and extracts the first balanced JSON object/array so JSON.parse works.
export function extractJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  let text = raw.trim();

  // Remove markdown code fences if present.
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // Find the first { or [ and the matching last } or ].
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1;
  let end = -1;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    end = text.lastIndexOf("]");
  } else if (firstObj !== -1) {
    start = firstObj;
    end = text.lastIndexOf("}");
  }
  if (start === -1 || end === -1 || end < start) return fallback;

  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
}
