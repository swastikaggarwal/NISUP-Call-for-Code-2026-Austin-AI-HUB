import { NextResponse } from "next/server";
import { getCases, getCaseById } from "@/lib/store";
import { extractEntities } from "@/lib/entities";
import { imagePHashes } from "@/lib/phash";
import { findNexus } from "@/lib/nexus";
import type { CaseRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/nexus?id=<caseId|referenceId> — linked cases for a stored case.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ links: [] });
  const target = getCaseById(id);
  if (!target) return NextResponse.json({ links: [] });
  const links = findNexus(target, getCases());
  return NextResponse.json({ links });
}

// POST /api/nexus { caseRecord } — links for an in-progress (unsaved) case,
// so the assistant can proactively surface a related existing case mid-chat.
export async function POST(request: Request) {
  try {
    const { caseRecord } = (await request.json()) as {
      caseRecord: Partial<CaseRecord> & { transcript?: { content: string }[] };
    };
    const target: CaseRecord = {
      id: "__live__",
      userType: caseRecord.userType ?? "unknown",
      situationType: caseRecord.situationType ?? "Unknown",
      summary: caseRecord.summary ?? "",
      location: caseRecord.location ?? "",
      peopleInvolved: caseRecord.peopleInvolved ?? "",
      contacts: caseRecord.contacts,
      evidence: caseRecord.evidence ?? "",
      dates: caseRecord.dates ?? "",
      urgency: caseRecord.urgency ?? "Low",
      reportMessage: caseRecord.reportMessage ?? "",
      attachments: caseRecord.attachments ?? [],
      transcript: caseRecord.transcript as CaseRecord["transcript"],
      entities: extractEntities(caseRecord),
    };
    target.entities!.imagePHashes = await imagePHashes(target.attachments);
    const links = findNexus(target, getCases());
    return NextResponse.json({ links });
  } catch (err) {
    console.error("/api/nexus error", err);
    return NextResponse.json({ links: [] }, { status: 200 });
  }
}
