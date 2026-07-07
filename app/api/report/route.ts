import { NextResponse } from "next/server";
import { addCase } from "@/lib/store";
import { referenceId, randomId } from "@/lib/utils";
import { extractEntities } from "@/lib/entities";
import { imagePHashes } from "@/lib/phash";
import type { CaseRecord } from "@/lib/types";

// POST /api/report  { caseRecord } -> { referenceId, routedTo }
// Creates a report, assigns a reference ID, and "routes" it to the matched
// authority. For the MVP this saves to the in-memory store (so it appears on
// the dashboard) instead of calling a real authority API.
// TODO: integrate real authority intake APIs + persistence + encryption.
export async function POST(request: Request) {
  try {
    const { caseRecord } = (await request.json()) as {
      caseRecord: Partial<CaseRecord>;
    };

    const ref = referenceId();
    const now = new Date().toISOString().slice(0, 10);

    const record: CaseRecord = {
      id: randomId("case"),
      userType: caseRecord.userType ?? "unknown",
      situationType: caseRecord.situationType ?? "Unknown",
      summary: caseRecord.summary ?? "Unknown",
      location: caseRecord.location ?? "Unknown",
      peopleInvolved: caseRecord.peopleInvolved ?? "Unknown",
      evidence: caseRecord.evidence ?? "Unknown",
      dates: caseRecord.dates ?? now,
      urgency: caseRecord.urgency ?? "Medium",
      reportMessage: caseRecord.reportMessage ?? "",
      contacts: caseRecord.contacts,
      authorityBrief: caseRecord.authorityBrief,
      riskBand: caseRecord.riskBand,
      redFlags: caseRecord.redFlags ?? [],
      isNote: caseRecord.isNote === true, // private notes never reach the dashboard
      matchedAuthority: caseRecord.matchedAuthority ?? "National Anti-Trafficking Helpline",
      referenceId: ref,
      status: "New",
      createdAt: now,
      // Approx location so the case appears on the dashboard map (demo center).
      lat: caseRecord.lat ?? 28.6139 + (Math.random() - 0.5) * 0.15,
      lng: caseRecord.lng ?? 77.209 + (Math.random() - 0.5) * 0.15,
      transcript: caseRecord.transcript ?? [],
      attachments: caseRecord.attachments ?? [],
    };

    // Extract identifying entities for cross-case nexus detection, plus
    // perceptual hashes of any images (near-duplicate photo matching).
    record.entities = extractEntities(record);
    record.entities.imagePHashes = await imagePHashes(record.attachments);

    addCase(record);

    return NextResponse.json({
      referenceId: ref,
      routedTo: record.matchedAuthority,
      status: "received",
    });
  } catch (err) {
    console.error("/api/report error", err);
    return NextResponse.json(
      { error: "Could not file the report right now." },
      { status: 500 }
    );
  }
}
