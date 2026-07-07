import { NextResponse } from "next/server";
import { getCases } from "@/lib/store";
import { findPatterns } from "@/lib/nexus";

export const dynamic = "force-dynamic";

// GET /api/patterns — cross-case pattern alerts (possible same offender/network)
// across all stored cases, scored by weighted similarity. Powers the authority
// dashboard's Pattern Alerts panel.
export async function GET() {
  const alerts = findPatterns(getCases()).slice(0, 12);
  return NextResponse.json({ alerts });
}
