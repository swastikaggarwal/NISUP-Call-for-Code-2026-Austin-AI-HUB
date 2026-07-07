import { NextResponse } from "next/server";
import { getCases } from "@/lib/store";

// GET /api/cases -> all cases (sample + any filed this session).
// Not cached: reflects newly filed reports immediately.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ cases: getCases() });
}
