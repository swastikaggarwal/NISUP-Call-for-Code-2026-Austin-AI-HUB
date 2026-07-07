import type { CaseEntities, CaseRecord, NexusSignal } from "./types";
import { extractEntities, normalise } from "./entities";
import { hammingHex } from "./phash";

// Weighted similarity scorer: produces a 0–100% match between two cases by
// blending several signals. Shared unique identifiers (email/phone/image) weigh
// most; exact names/orgs next; a shared first name (Ravi Kumar ≈ Ravi Singh) or
// same area/type are supporting signals. Returns the percentage + a breakdown.

const WEIGHTS = {
  email: 45,
  phone: 40,
  image: 40,
  name: 32,
  org: 30,
  location: 14,
  type: 6,
};
const PHASH_NEAR = 10; // Hamming ≤ this ⇒ same photo (near-duplicate)

function ents(c: CaseRecord): CaseEntities {
  return c.entities ?? extractEntities(c);
}

function tokens(s: string): string[] {
  return normalise(s)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, "")) // strip commas, parens, etc.
    .filter((t) => t.length > 1);
}

function bigrams(s: string): Set<string> {
  const g = new Set<string>();
  const t = normalise(s).replace(/\s+/g, "");
  for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2));
  return g;
}
function dice(a: string, b: string): number {
  const ga = bigrams(a);
  const gb = bigrams(b);
  if (!ga.size || !gb.size) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

// Name/org similarity 0..1 with an explanatory note.
function fuzzy(a: string, b: string): { score: number; note: string } {
  if (a === b) return { score: 1, note: "exact match" };
  const ta = tokens(a);
  const tb = tokens(b);
  const shared = ta.filter((t) => tb.includes(t));
  if (shared.length >= 2) return { score: 1, note: "same full name" };
  const d = dice(a, b);
  if (d >= 0.8) return { score: 0.9, note: "near-identical spelling" };
  if (ta[0] && ta[0] === tb[0])
    return { score: 0.5, note: `same first name “${ta[0]}”` };
  if (shared.length === 1 && shared[0].length >= 5)
    return { score: 0.5, note: `shared name “${shared[0]}”` };
  if (d >= 0.55) return { score: 0.5, note: "similar spelling" };
  return { score: d, note: "" };
}

function bestFuzzy(as: string[], bs: string[]) {
  let best = { score: 0, note: "", value: "" };
  for (const a of as)
    for (const b of bs) {
      const f = fuzzy(a, b);
      if (f.score > best.score) best = { ...f, value: a };
    }
  return best;
}

// Generic place words that shouldn't count as a location match on their own.
const LOC_STOP = new Set([
  "north",
  "south",
  "east",
  "west",
  "central",
  "city",
  "district",
  "area",
  "hub",
  "downtown",
  "old",
  "new",
  "the",
  "sector",
  "zone",
  "market",
  "street",
  "road",
  "uae",
  "usa",
]);
function locationMatch(a?: string, b?: string) {
  if (!a || !b) return null;
  const ta = new Set(
    tokens(a).filter((t) => t.length > 2 && !LOC_STOP.has(t))
  );
  const tb = tokens(b).filter((t) => t.length > 2 && !LOC_STOP.has(t));
  const shared = tb.find((t) => ta.has(t));
  return shared ?? null;
}

export interface ScoreResult {
  percent: number;
  strength: "strong" | "medium" | "weak";
  shared: NexusSignal[];
}

export function scoreCases(a: CaseRecord, b: CaseRecord): ScoreResult {
  const ea = ents(a);
  const eb = ents(b);
  const shared: NexusSignal[] = [];
  let total = 0;

  // email
  const email = ea.emails.find((e) => eb.emails.includes(e));
  if (email) {
    total += WEIGHTS.email;
    shared.push({ type: "email", value: email, weight: WEIGHTS.email });
  }
  // phone
  const phone = ea.phones.find((p) => eb.phones.includes(p));
  if (phone) {
    total += WEIGHTS.phone;
    shared.push({ type: "phone", value: `…${phone.slice(-4)}`, weight: WEIGHTS.phone });
  }
  // image — exact content hash OR near-duplicate perceptual hash
  let imageMatched = false;
  if (ea.imageHashes.some((h) => eb.imageHashes.includes(h))) {
    imageMatched = true;
    shared.push({ type: "image", value: "identical image", weight: WEIGHTS.image });
  } else if (ea.imagePHashes && eb.imagePHashes) {
    for (const h1 of ea.imagePHashes)
      for (const h2 of eb.imagePHashes)
        if (hammingHex(h1, h2) <= PHASH_NEAR) imageMatched = true;
    if (imageMatched)
      shared.push({ type: "image", value: "matching photo (near-duplicate)", weight: WEIGHTS.image });
  }
  if (imageMatched) total += WEIGHTS.image;

  // name (fuzzy) — but skip if it only echoes an org we already counted
  const nameF = bestFuzzy(ea.names, eb.names);
  if (nameF.score >= 0.5) {
    const w = Math.round(WEIGHTS.name * nameF.score);
    total += w;
    shared.push({ type: "name", value: `${nameF.value}${nameF.note ? ` (${nameF.note})` : ""}`, weight: w });
  }
  // org (fuzzy)
  const orgF = bestFuzzy(ea.orgs, eb.orgs);
  if (orgF.score >= 0.5) {
    const w = Math.round(WEIGHTS.org * orgF.score);
    total += w;
    shared.push({ type: "org", value: `${orgF.value}${orgF.note ? ` (${orgF.note})` : ""}`, weight: w });
  }
  // location
  const loc = locationMatch(a.location, b.location);
  if (loc) {
    total += WEIGHTS.location;
    shared.push({ type: "location", value: loc, weight: WEIGHTS.location });
  }
  // situation type
  if (
    a.situationType &&
    a.situationType !== "Unknown" &&
    a.situationType === b.situationType
  ) {
    total += WEIGHTS.type;
    shared.push({ type: "type", value: a.situationType, weight: WEIGHTS.type });
  }

  const percent = Math.min(100, Math.round(total));
  const strength: ScoreResult["strength"] =
    percent >= 70 ? "strong" : percent >= 45 ? "medium" : "weak";
  return { percent, strength, shared: shared.sort((x, y) => y.weight - x.weight) };
}
