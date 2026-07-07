import type { CaseEntities, CaseRecord } from "./types";

// Extracts identifying entities from a case so cases can be linked into a
// "nexus" when they share the same person, contact, or organisation.
// Text signals are the strong, reliable ones. Image signals use a content hash
// (exact-duplicate detection).
// TODO: upgrade image matching to a perceptual hash (dHash/pHash → Hamming
// distance) for near-duplicate photos, and route audio through transcription.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
// Phone-ish: 7–15 digits allowing +, spaces, dashes, parentheses.
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
// Quoted or "called X" organisation names, e.g. 'Rapid Overseas Placements'.
const QUOTED_RE = /['"“]([^'"”]{3,60})['"”]/g;
const CALLED_RE = /\b(?:agency|company|organisation|organization|firm|office|recruiter)\s+(?:called|named)\s+([A-Z][\w&.\- ]{2,50})/gi;

// Generic descriptors that are NOT identifying — never treat these as a name/org.
const GENERIC = new Set(
  [
    "unknown",
    "anonymous",
    "anonymous reporter",
    "n/a",
    "none",
    "recruiter",
    "owner",
    "workshop owner",
    "employer",
    "family",
    "family members",
    "household",
    "employing household",
    "operator",
    "kiln operator",
    "trafficker",
    "unnamed",
    "the agency",
    "a young boy",
    "individuals",
    "unknown individuals",
    "construction staffing office",
    "staffing office",
  ].map((s) => s.toLowerCase())
);

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"“”.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normPhone(s: string): string {
  const d = s.replace(/\D/g, "");
  return d.length >= 7 ? d.slice(-10) : ""; // last 10 digits as the key
}

// Cheap, stable content hash (djb2) for exact-duplicate image detection.
export function contentHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function isIdentifying(name: string): boolean {
  const n = normalise(name);
  if (n.length < 3) return false;
  if (GENERIC.has(n)) return false;
  // must contain a letter, and not be a single generic word
  if (!/[a-z]/i.test(n)) return false;
  return true;
}

export function extractEntities(
  record: Partial<CaseRecord> & { transcript?: { content: string }[] }
): CaseEntities {
  const textParts = [
    record.summary,
    record.reportMessage,
    record.peopleInvolved,
    record.contacts,
    record.evidence,
    ...(record.transcript?.map((t) => t.content) ?? []),
  ].filter(Boolean) as string[];
  const text = textParts.join("\n");

  const emails = uniq(
    (text.match(EMAIL_RE) ?? []).map((e) =>
      e.toLowerCase().replace(/[.,;:]+$/, "")
    )
  );
  const phones = uniq(
    (text.match(PHONE_RE) ?? []).map(normPhone).filter((p) => p.length >= 7)
  );

  // Organisations: quoted names + "agency called X".
  const orgSet = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = QUOTED_RE.exec(text))) {
    if (isIdentifying(m[1])) orgSet.add(normalise(m[1]));
  }
  while ((m = CALLED_RE.exec(text))) {
    if (isIdentifying(m[1])) orgSet.add(normalise(m[1]));
  }

  // People/orgs from the peopleInvolved + contacts fields (split on separators).
  const names = new Set<string>();
  for (const field of [record.peopleInvolved, record.contacts]) {
    if (!field) continue;
    for (const part of field.split(/[,;]|\band\b|\bor\b/i)) {
      const p = part.trim();
      if (isIdentifying(p)) {
        // If it looks like a proper name/org (has a capital or 2+ words), keep it.
        if (/[A-Z]/.test(p) || p.split(/\s+/).length >= 2) names.add(normalise(p));
      }
    }
  }

  const imageHashes = uniq(
    (record.attachments ?? [])
      .filter((a) => a.kind === "image")
      .map((a) => contentHash(a.ref))
  );

  return {
    emails,
    phones,
    names: [...names],
    orgs: [...orgSet],
    imageHashes,
  };
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}
