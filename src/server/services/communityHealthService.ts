import { prisma } from "@/lib/prisma";

export interface HealthMetrics {
  activeUsers: number;
  totalMembers: number;
  newConnections: number;
  helpRequestsSolved: number;
  isolatedUsers: number;
  score: number;
}

export const communityHealthService = {
  async calculate(communityId: string): Promise<HealthMetrics> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total members
    const totalMembers = await prisma.membership.count({ where: { communityId } });

    // Active users last 7 days
    const activeUserIds = await prisma.interaction.groupBy({
      by: ["actorId"],
      where: { communityId, timestamp: { gte: sevenDaysAgo } },
    });
    const activeUsers = activeUserIds.length;

    // New connections last 7 days
    const newConnections = await prisma.connection.count({
      where: {
        OR: [
          {
            userA: { memberships: { some: { communityId } } },
          },
        ],
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Help requests solved last 7 days
    const helpRequestsSolved = await prisma.helpRequest.count({
      where: {
        communityId,
        status: "RESOLVED",
        updatedAt: { gte: sevenDaysAgo },
      },
    });

    // Isolated users: members with 0 connections
    const memberships = await prisma.membership.findMany({
      where: { communityId },
      select: { userId: true },
    });
    const memberIds = memberships.map((m) => m.userId);

    let isolatedCount = 0;
    for (const userId of memberIds) {
      const connectionCount = await prisma.connection.count({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      });
      if (connectionCount === 0) isolatedCount++;
    }

    const isolatedUsers = isolatedCount;

    // ── Score formula ────────────────────────────────────────────────────────
    const activityScore = totalMembers > 0 ? (activeUsers / totalMembers) * 100 : 0;
    const connectionScore = Math.min(100, newConnections * 10);
    const helpScore = Math.min(100, helpRequestsSolved * 20);
    const isolationPenalty =
      totalMembers > 0 ? ((totalMembers - isolatedUsers) / totalMembers) * 100 : 100;

    const score = Math.round(
      0.3 * activityScore +
        0.3 * connectionScore +
        0.2 * helpScore +
        0.2 * isolationPenalty,
    );

    // Persist back to community
    await prisma.community.update({
      where: { id: communityId },
      data: { healthScore: score },
    });

    return {
      activeUsers,
      totalMembers,
      newConnections,
      helpRequestsSolved,
      isolatedUsers,
      score,
    };
  },

  async calculateAll() {
    const communities = await prisma.community.findMany({ select: { id: true } });
    return Promise.all(communities.map((c) => communityHealthService.calculate(c.id)));
  },
};
