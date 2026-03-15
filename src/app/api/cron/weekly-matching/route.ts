import { NextRequest, NextResponse } from "next/server";
import { matchmakingService } from "@/server/services/matchmakingService";
import { prisma } from "@/lib/prisma";

// Protect with a shared secret so only Vercel Cron can call this
function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communities = await prisma.community.findMany({ select: { id: true, name: true } });
  const results: Record<string, number> = {};

  for (const community of communities) {
    const matches = await matchmakingService.runWeeklyMatchmaking(community.id);
    results[community.name] = matches.length;
  }

  return NextResponse.json({ success: true, results });
}
