import knowledgeBase from "@/data/knowledge-base.json";

// Lightweight, dependency-free RAG retriever. Scores each knowledge chunk
// against the query using TF-IDF-weighted token overlap (free, no vector DB,
// no API). This grounds the assistant in curated case examples + guidance.
//
// TODO: upgrade to real vector embeddings (e.g. a local sentence-transformer or
// a hosted embeddings API) for semantic recall beyond keyword overlap.

interface KBChunk {
  id: string;
  title: string;
  situationType?: string;
  userType?: string;
  topic?: string;
  signals?: string;
  guidance?: string;
  whoHelps?: string;
  example?: string;
}

const KB = knowledgeBase as KBChunk[];

const STOP = new Set(
  "a an and the is are was were be been being to of in on for with at by from as it this that i you they we he she them my your our their me us do does did have has had not no yes can could would should will just about into over under out up down if then so than".split(
    " "
  )
);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(
    (t) => t.length > 2 && !STOP.has(t)
  );
}

function chunkText(c: KBChunk): string {
  return [
    c.title,
    c.situationType,
    c.userType,
    c.topic,
    c.signals,
    c.guidance,
    c.whoHelps,
    c.example,
  ]
    .filter(Boolean)
    .join(" ");
}

// Precompute document frequencies for IDF weighting.
const docTokens = KB.map((c) => new Set(tokenize(chunkText(c))));
const df = new Map<string, number>();
for (const toks of docTokens) {
  for (const t of toks) df.set(t, (df.get(t) ?? 0) + 1);
}
const N = KB.length;
function idf(term: string): number {
  return Math.log((N + 1) / ((df.get(term) ?? 0) + 1)) + 1;
}

export interface Retrieved {
  chunk: KBChunk;
  score: number;
}

// Return the top-k most relevant knowledge chunks for a query.
export function retrieve(query: string, k = 3): Retrieved[] {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const qCount = new Map<string, number>();
  for (const t of qTokens) qCount.set(t, (qCount.get(t) ?? 0) + 1);

  const scored = KB.map((chunk, i) => {
    const docSet = docTokens[i];
    let score = 0;
    for (const [term, tf] of qCount) {
      if (docSet.has(term)) score += tf * idf(term);
    }
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Format retrieved chunks into a compact reference block for the system prompt.
export function buildContext(query: string, k = 3): string {
  const hits = retrieve(query, k);
  if (!hits.length) return "";
  const blocks = hits.map(({ chunk }) => {
    const lines = [`• ${chunk.title}`];
    if (chunk.guidance) lines.push(`  Guidance: ${chunk.guidance}`);
    if (chunk.whoHelps) lines.push(`  Who can help: ${chunk.whoHelps}`);
    if (chunk.example) lines.push(`  Example: ${chunk.example}`);
    return lines.join("\n");
  });
  return `RELEVANT KNOWLEDGE (retrieved for this message — use it to ground your reply, do not quote it verbatim or mention that you retrieved anything):\n${blocks.join(
    "\n"
  )}`;
}
