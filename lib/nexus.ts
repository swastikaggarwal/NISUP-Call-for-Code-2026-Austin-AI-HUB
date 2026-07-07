import type { CaseRecord, NexusLink, PatternAlert } from "./types";
import { scoreCases } from "./similarity";

const SHOW_THRESHOLD = 45; // minimum % to surface a link/pattern

// Find cases linked to a target, scored by weighted similarity (0–100%).
export function findNexus(target: CaseRecord, others: CaseRecord[]): NexusLink[] {
  const links: NexusLink[] = [];
  for (const other of others) {
    if (other.id === target.id) continue;
    if (target.referenceId && other.referenceId === target.referenceId) continue;
    if (other.isNote) continue; // private notes never surface as linked cases
    const { percent, strength, shared } = scoreCases(target, other);
    if (percent < SHOW_THRESHOLD || !shared.length) continue;
    links.push({
      caseId: other.id,
      referenceId: other.referenceId,
      situationType: other.situationType,
      summary: other.summary,
      createdAt: other.createdAt,
      location: other.location,
      matchPercent: percent,
      strength: strength === "weak" ? "medium" : strength,
      shared,
    });
  }
  return links.sort((a, b) => b.matchPercent - a.matchPercent);
}

// All-pairs pattern detection across every case — for the authority dashboard.
// Surfaces the strongest cross-case links (possible same offender / network).
// Private notes are excluded: they were never filed to an authority.
export function findPatterns(allCases: CaseRecord[]): PatternAlert[] {
  const cases = allCases.filter((c) => !c.isNote);
  const alerts: PatternAlert[] = [];
  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      const a = cases[i];
      const b = cases[j];
      const { percent, shared } = scoreCases(a, b);
      if (percent < SHOW_THRESHOLD || !shared.length) continue;
      const da = Date.parse(a.createdAt ?? "") || 0;
      const db = Date.parse(b.createdAt ?? "") || 0;
      const daysApart =
        da && db ? Math.round(Math.abs(da - db) / 86400000) : 0;
      alerts.push({
        aId: a.id,
        bId: b.id,
        aRef: a.referenceId,
        bRef: b.referenceId,
        matchPercent: percent,
        daysApart,
        shared,
        summaryA: a.summary,
        summaryB: b.summary,
        situationA: a.situationType,
        situationB: b.situationType,
      });
    }
  }
  return alerts.sort((x, y) => y.matchPercent - x.matchPercent);
}
