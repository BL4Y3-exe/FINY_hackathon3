import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { matchmakingService } from "@/server/services/matchmakingService";

export const matchRouter = router({
  // Find top peer matches for current user in a community
  findPeers: protectedProcedure
    .input(z.object({ communityId: z.string(), limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return matchmakingService.findMatches(userId, input.communityId, input.limit);
    }),

  // Initiate a match request
  requestMatch: protectedProcedure
    .input(z.object({ targetUserId: z.string(), communityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (userId === input.targetUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot match with yourself" });
      }
      // Find score
      const candidates = await matchmakingService.findMatches(userId, input.communityId, 20);
      const candidate = candidates.find((c) => c.userId === input.targetUserId);
      const score = candidate?.score ?? 0;

      return matchmakingService.createMatch(userId, input.targetUserId, input.communityId, score);
    }),

  // Accept a match
  accept: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return matchmakingService.acceptMatch(input.matchId, ctx.session.user.id);
    }),

  // Reject a match
  reject: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.findUnique({ where: { id: input.matchId } });
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });
      if (match.userAId !== ctx.session.user.id && match.userBId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.match.update({
        where: { id: input.matchId },
        data: { status: "REJECTED" },
      });
    }),

  // List matches for current user in a community
  list: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.match.findMany({
        where: {
          communityId: input.communityId,
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        include: {
          userA: { select: { id: true, name: true, image: true, profile: true } },
          userB: { select: { id: true, name: true, image: true, profile: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Community-wide stats
  weeklyStats: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const total = await ctx.prisma.match.count({
        where: { communityId: input.communityId, createdAt: { gte: sevenDaysAgo } },
      });
      const accepted = await ctx.prisma.match.count({
        where: {
          communityId: input.communityId,
          status: "ACCEPTED",
          updatedAt: { gte: sevenDaysAgo },
        },
      });
      return { total, accepted };
    }),
});
