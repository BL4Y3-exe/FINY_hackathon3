import { NextRequest, NextResponse } from "next/server";
import { communityHealthService } from "@/server/services/communityHealthService";

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await communityHealthService.calculateAll();
  return NextResponse.json({ success: true, count: results.length });
}
