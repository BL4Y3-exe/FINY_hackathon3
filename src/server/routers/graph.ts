import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { communityHealthService } from "@/server/services/communityHealthService";

export const graphRouter = router({
  // Build graph data for a community
  networkData: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { communityId } = input;

      // Get all members
      const memberships = await ctx.prisma.membership.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: true,
              connectionsAsA: true,
              connectionsAsB: true,
            },
          },
        },
      });

      // Get all connections between community members
      const memberIds = memberships.map((m) => m.userId);

      const connections = await ctx.prisma.connection.findMany({
        where: {
          userAId: { in: memberIds },
          userBId: { in: memberIds },
        },
      });

      // Compute degree for each node
      const degreeMap = new Map<string, number>();
      connections.forEach((c) => {
        degreeMap.set(c.userAId, (degreeMap.get(c.userAId) ?? 0) + 1);
        degreeMap.set(c.userBId, (degreeMap.get(c.userBId) ?? 0) + 1);
      });

      const nodes = memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name ?? m.user.id,
        image: m.user.image,
        skills: m.user.profile?.skills ?? [],
        interests: m.user.profile?.interests ?? [],
        degree: degreeMap.get(m.user.id) ?? 0,
        isIsolated: (degreeMap.get(m.user.id) ?? 0) === 0,
        role: m.role,
      }));

      const links = connections.map((c) => ({
        source: c.userAId,
        target: c.userBId,
        type: c.type,
        weight: c.weight,
      }));

      return { nodes, links };
    }),

  // Community health score and metrics
  healthScore: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      return communityHealthService.calculate(input.communityId);
    }),

  // Isolated user detection
  isolatedUsers: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const memberships = await ctx.prisma.membership.findMany({
        where: { communityId: input.communityId },
        select: { userId: true },
      });
      const memberIds = memberships.map((m) => m.userId);

      const results = [];
      for (const userId of memberIds) {
        const count = await ctx.prisma.connection.count({
          where: { OR: [{ userAId: userId }, { userBId: userId }] },
        });
        if (count === 0) {
          const user = await ctx.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, image: true, profile: true },
          });
          if (user) results.push(user);
        }
      }
      return results;
    }),
});
