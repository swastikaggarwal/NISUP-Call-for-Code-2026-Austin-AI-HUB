import { NextResponse } from "next/server";
import { updateCaseStatus } from "@/lib/store";
import type { CaseStatus } from "@/lib/types";

// POST /api/case-status { id, status } — an authority updates a case status.
// Persisted so the reporter's tracking page reflects it live.
export async function POST(request: Request) {
  try {
    const { id, status } = (await request.json()) as {
      id: string;
      status: CaseStatus;
    };
    const updated = updateCaseStatus(id, status);
    if (!updated)
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error("/api/case-status error", err);
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
}
