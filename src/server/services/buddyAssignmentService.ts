import { prisma } from "@/lib/prisma";

export const buddyAssignmentService = {
  async assignBuddy(newUserId: string, communityId: string) {
    // Check if already has a buddy
    const existing = await prisma.buddyAssignment.findFirst({
      where: { newUserId, communityId },
    });
    if (existing) return existing;

    // Find current buddy assignment counts to avoid overloading
    const buddyCounts = await prisma.buddyAssignment.groupBy({
      by: ["buddyUserId"],
      where: { communityId },
      _count: true,
    });
    const buddyLoadMap = new Map(buddyCounts.map((b) => [b.buddyUserId, b._count]));

    // Load community members (excluding new user)
    const members = await prisma.membership.findMany({
      where: {
        communityId,
        userId: { not: newUserId },
        role: { in: ["MEMBER", "ADMIN"] },
      },
      include: {
        user: {
          include: {
            profile: true,
            interactionsActor: {
              where: {
                communityId,
                timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              },
            },
          },
        },
      },
    });

    if (members.length === 0) return null;

    const newUserProfile = await prisma.profile.findUnique({
      where: { userId: newUserId },
    });

    // Score potential buddies
    const scored = members.map((m) => {
      const user = m.user;
      const load = buddyLoadMap.get(user.id) ?? 0;
      const isActive = user.interactionsActor.length > 0;
      const maxLoad = 3; // max buddy assignments per person

      if (load >= maxLoad) return { userId: user.id, score: -Infinity };

      // Activity bonus
      let score = isActive ? 2 : 0;

      // Similar interests bonus
      if (newUserProfile && user.profile) {
        const sharedInterests = (newUserProfile.interests ?? []).filter((i) =>
          (user.profile?.interests ?? [])
            .map((x) => x.toLowerCase())
            .includes(i.toLowerCase()),
        );
        score += sharedInterests.length;
      }

      // Low load bonus
      score += Math.max(0, maxLoad - load);

      return { userId: user.id, score };
    });

    const best = scored.sort((a, b) => b.score - a.score)[0];
    if (!best || best.score === -Infinity) return null;

    // Create assignment
    const assignment = await prisma.buddyAssignment.create({
      data: {
        newUserId,
        buddyUserId: best.userId,
        communityId,
      },
    });

    // Create connection edge
    const [a, b] = [newUserId, best.userId].sort();
    await prisma.connection.upsert({
      where: { userAId_userBId_type: { userAId: a, userBId: b, type: "BUDDY" } },
      update: {},
      create: { userAId: a, userBId: b, type: "BUDDY", weight: 1 },
    });

    // Record interaction
    await prisma.interaction.create({
      data: {
        type: "BUDDY_ASSIGNED",
        actorId: best.userId,
        targetId: newUserId,
        communityId,
      },
    });

    return assignment;
  },
};
