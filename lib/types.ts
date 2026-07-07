// Shared domain types for NISUP.

export type UserType = "survivor" | "victim" | "at_risk" | "witness" | "unknown";
export type Urgency = "Low" | "Medium" | "High";
export type CaseStatus = "New" | "In Review" | "Action Taken";

// Flag-triage band. Re-evaluated EVERY turn — green is a tone, never a lock:
// green = informational doubt (conclude warmly, no filing push)
// amber = concerning (clarify, set a "come back if X" tripwire)
// red   = serious indicators (name the pattern, firm filing offer, consent first)
export type RiskBand = "green" | "amber" | "red";

export type LanguageCode = "en" | "hi" | "es" | "ar" | "bn";

export interface Language {
  code: LanguageCode;
  label: string; // native label shown in UI
  speechLocale: string; // BCP-47 tag for Web Speech API
  rtl?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// A single piece of evidence attached to the conversation.
export interface Evidence {
  id: string;
  kind: "image" | "voice" | "video" | "link" | "file";
  label: string; // human description
  ref: string; // data URL / object URL / link — MVP only. // TODO: upload + encrypt
  addedAt: string;
}

// Identifying entities extracted for cross-case nexus detection.
export interface CaseEntities {
  emails: string[];
  phones: string[]; // normalised to digits
  names: string[]; // people
  orgs: string[]; // agencies / companies
  imageHashes: string[]; // content hashes of attached images (exact-dup)
  imagePHashes?: string[]; // perceptual hashes (near-dup / same photo)
}

// A single matched signal contributing to a nexus score.
export interface NexusSignal {
  type: "email" | "phone" | "name" | "org" | "image" | "location" | "type";
  value: string; // human-readable, e.g. "Ravi (same first name)"
  weight: number; // points contributed
}

// A link between two cases that share one or more entities, with a % score.
export interface NexusLink {
  caseId: string;
  referenceId?: string;
  situationType: string;
  summary: string;
  createdAt?: string;
  location?: string;
  matchPercent: number; // 0–100 weighted similarity
  strength: "strong" | "medium";
  shared: NexusSignal[];
}

// A cross-case pattern surfaced to the authority (possible network / same actor).
export interface PatternAlert {
  aId: string;
  bId: string;
  aRef?: string;
  bRef?: string;
  matchPercent: number;
  daysApart: number;
  shared: NexusSignal[];
  summaryA: string;
  summaryB: string;
  situationA: string;
  situationB: string;
}

// The structured record the bot silently builds from the conversation.
export interface CaseRecord {
  id: string;
  userType: UserType;
  situationType: string;
  summary: string;
  location: string;
  peopleInvolved: string;
  contacts?: string; // phones/emails/handles/agency names, copied verbatim
  evidence: string; // narrative of what was attached/mentioned
  dates: string;
  urgency: Urgency;
  reportMessage: string; // first-person report for the authority
  authorityBrief?: string; // AI brief written for the receiving authority
  entities?: CaseEntities; // extracted identifiers for nexus matching
  history?: { at: string; label: string }[]; // timeline of status updates
  riskBand?: RiskBand; // triage band at the time of filing
  redFlags?: string[]; // concrete trafficking indicators actually mentioned
  isNote?: boolean; // private user note — never shown on the authority dashboard
  // Dashboard-only fields (present on sample cases):
  lat?: number;
  lng?: number;
  status?: CaseStatus;
  createdAt?: string;
  referenceId?: string;
  matchedAuthority?: string;
  transcript?: ChatMessage[];
  attachments?: Evidence[];
}

export interface Authority {
  name: string;
  type: string; // police / labour inspector / NGO / child protection / embassy
  situationTypes: string[];
  region: string;
  phone: string;
  email: string;
  description: string;
}

export interface SurvivorStory {
  id: string;
  situationType: string;
  region: string;
  story: string;
  whatHelped: string;
}

export interface CommunityAlert {
  id: string;
  situationType: string;
  area: string;
  message: string;
  postedAt: string;
}

export interface Match {
  name: string;
  reason: string;
}

// Pattern-detection output for the dashboard analytics panel.
export interface PatternFlag {
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

export interface Classification {
  groups: { situationType: string; count: number; caseIds: string[] }[];
  patterns: PatternFlag[];
}
