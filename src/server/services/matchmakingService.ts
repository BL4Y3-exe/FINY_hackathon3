import { prisma } from "@/lib/prisma";
import { jaccardSimilarity } from "@/lib/utils";

interface MatchCandidate {
  userId: string;
  name: string | null;
  image: string | null;
  score: number;
  sharedInterests: string[];
  complementarySkills: string[];
}

/**
 * Core matchmaking algorithm.
 *
 * Score formula:
 *   sharedInterests  * 2.0
 *   complementarySkills * 1.5
 *   timezoneMatch    * 1.0
 *   lowConnectionBonus * 0.5 per degree below average
 */
export const matchmakingService = {
  async findMatches(
    userId: string,
    communityId: string,
    limit = 5,
  ): Promise<MatchCandidate[]> {
    // Load requester's profile
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!requester?.profile) return [];

    const profile = requester.profile;

    // Load previous matches to exclude
    const previousMatches = await prisma.match.findMany({
      where: {
        communityId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });
    const excludedIds = new Set<string>([userId]);
    previousMatches.forEach((m) => {
      excludedIds.add(m.userAId);
      excludedIds.add(m.userBId);
    });

    // Load community members (excluding already matched)
    const members = await prisma.membership.findMany({
      where: {
        communityId,
        userId: { notIn: [...excludedIds] },
      },
      include: {
        user: {
          include: {
            profile: true,
            connectionsAsA: true,
            connectionsAsB: true,
          },
        },
      },
    });

    // Compute average connection degree across members
    const connectionDegrees = members.map(
      (m) => m.user.connectionsAsA.length + m.user.connectionsAsB.length,
    );
    const avgDegree =
      connectionDegrees.length > 0
        ? connectionDegrees.reduce((a, b) => a + b, 0) / connectionDegrees.length
        : 0;

    const candidates: MatchCandidate[] = members
      .filter((m) => m.user.profile) // only users with profiles
      .map((m) => {
        const candidate = m.user;
        const cProfile = candidate.profile!;

        // Shared interests
        const myInterests = profile.interests ?? [];
        const theirInterests = cProfile.interests ?? [];
        const sharedInterests = myInterests.filter((i) =>
          theirInterests.map((x) => x.toLowerCase()).includes(i.toLowerCase()),
        );

        // Complementary skills (they have skills I don't)
        const mySkills = (profile.skills ?? []).map((s) => s.toLowerCase());
        const theirSkills = (cProfile.skills ?? []).map((s) => s.toLowerCase());
        const complementarySkills = theirSkills.filter((s) => !mySkills.includes(s));

        // Timezone match
        const timezoneMatch = profile.timezone === cProfile.timezone ? 1 : 0;

        // Low-connection bonus
        const degree = candidate.connectionsAsA.length + candidate.connectionsAsB.length;
        const connectionBonus = Math.max(0, avgDegree - degree) * 0.5;

        const score =
          sharedInterests.length * 2.0 +
          complementarySkills.length * 1.5 +
          timezoneMatch * 1.0 +
          connectionBonus;

        return {
          userId: candidate.id,
          name: candidate.name,
          image: candidate.image,
          score,
          sharedInterests,
          complementarySkills: complementarySkills.map(
            (s) => cProfile.skills?.find((sk) => sk.toLowerCase() === s) ?? s,
          ),
        };
      });

    // Sort by score descending and return top matches
    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  async createMatch(
    userAId: string,
    userBId: string,
    communityId: string,
    score: number,
  ) {
    // Normalise order to avoid duplicates (smaller id first)
    const [normalA, normalB] = [userAId, userBId].sort();

    const match = await prisma.match.upsert({
      where: {
        userAId_userBId_communityId: {
          userAId: normalA,
          userBId: normalB,
          communityId,
        },
      },
      update: { status: "PENDING", score },
      create: {
        userAId: normalA,
        userBId: normalB,
        communityId,
        score,
        status: "PENDING",
      },
    });

    // Record interaction
    await prisma.interaction.create({
      data: {
        type: "MATCH",
        actorId: userAId,
        targetId: userBId,
        communityId,
      },
    });

    return match;
  },

  async acceptMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.userAId !== userId && match.userBId !== userId)
      throw new Error("Not authorized");

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: "ACCEPTED" },
    });

    // Upsert connection edge
    const [a, b] = [match.userAId, match.userBId].sort();
    await prisma.connection.upsert({
      where: { userAId_userBId_type: { userAId: a, userBId: b, type: "MATCH" } },
      update: { weight: { increment: 1 } },
      create: { userAId: a, userBId: b, type: "MATCH", weight: 1 },
    });

    return updated;
  },

  async runWeeklyMatchmaking(communityId: string) {
    const memberships = await prisma.membership.findMany({
      where: { communityId },
      select: { userId: true },
    });

    const results = [];
    for (const { userId } of memberships) {
      const candidates = await matchmakingService.findMatches(userId, communityId, 1);
      if (candidates.length > 0) {
        const top = candidates[0];
        const match = await matchmakingService.createMatch(
          userId,
          top.userId,
          communityId,
          top.score,
        );
        results.push(match);
      }
    }
    return results;
  },
};
