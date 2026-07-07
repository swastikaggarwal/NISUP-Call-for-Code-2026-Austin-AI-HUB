import fs from "fs";
import os from "os";
import path from "path";
import type { CaseRecord, CaseStatus } from "./types";
import sampleCases from "@/data/sample-cases.json";

// Case store for the MVP, persisted to a JSON file in the OS temp dir so filed
// reports survive server restarts AND stay in sync with the Authority Dashboard.
// Kept out of the project tree so writes don't trigger the Next.js file-watcher.
//
// TODO: replace with a real, encrypted database for production.
const FILE = path.join(os.tmpdir(), "nisup-cases.json");

const g = globalThis as unknown as { __nisupCases?: CaseRecord[] };

function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(g.__nisupCases ?? []), "utf8");
  } catch {
    /* best-effort */
  }
}

function load(): CaseRecord[] {
  if (g.__nisupCases) return g.__nisupCases;
  try {
    if (fs.existsSync(FILE)) {
      g.__nisupCases = JSON.parse(fs.readFileSync(FILE, "utf8")) as CaseRecord[];
      return g.__nisupCases;
    }
  } catch {
    /* fall through to seed */
  }
  g.__nisupCases = [...(sampleCases as CaseRecord[])];
  persist();
  return g.__nisupCases;
}

export function getCases(): CaseRecord[] {
  return load();
}

export function addCase(record: CaseRecord): void {
  const cases = load();
  cases.unshift(record); // newest first
  persist();
}

export function getCaseById(id: string): CaseRecord | undefined {
  return load().find((c) => c.id === id || c.referenceId === id);
}

// Authority updates a case status; persisted so the reporter's tracking page
// reflects it live. Records a timestamped entry on the case history.
export function updateCaseStatus(
  id: string,
  status: CaseStatus
): CaseRecord | undefined {
  const c = getCaseById(id);
  if (!c) return undefined;
  c.status = status;
  c.history = [
    ...(c.history ?? []),
    { at: new Date().toISOString(), label: `Status changed to “${status}”` },
  ];
  persist();
  return c;
}
