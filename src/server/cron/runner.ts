/**
 * Standalone cron runner — starts a long-running Node process.
 * Run with: npx tsx src/server/cron/runner.ts
 *
 * On Vercel, use Vercel Cron Jobs (vercel.json) that hit the API routes below.
 */

import cron from "node-cron";
import { matchmakingService } from "../services/matchmakingService";
import { communityHealthService } from "../services/communityHealthService";
import { prisma } from "@/lib/prisma";

console.log("⏰  PeerWeave cron runner started");

// Every Monday 08:00 UTC → run weekly matchmaking for all communities
cron.schedule("0 8 * * 1", async () => {
  console.log("[cron] ▶ weeklyMatchmaking started");
  try {
    const communities = await prisma.community.findMany({ select: { id: true, name: true } });
    for (const community of communities) {
      const results = await matchmakingService.runWeeklyMatchmaking(community.id);
      console.log(
        `[cron]   ${community.name}: ${results.length} new match suggestion(s)`,
      );
    }
    console.log("[cron] ✔ weeklyMatchmaking done");
  } catch (err) {
    console.error("[cron] ✖ weeklyMatchmaking failed:", err);
  }
});

// Every Sunday 23:00 UTC → recalculate health scores
cron.schedule("0 23 * * 0", async () => {
  console.log("[cron] ▶ healthCalculation started");
  try {
    const results = await communityHealthService.calculateAll();
    console.log(`[cron] ✔ healthCalculation done — ${results.length} communities updated`);
  } catch (err) {
    console.error("[cron] ✖ healthCalculation failed:", err);
  }
});
