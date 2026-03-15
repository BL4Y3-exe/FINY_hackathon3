import { prisma } from "@/lib/prisma";

interface ExpertCandidate {
  userId: string;
  name: string | null;
  image: string | null;
  matchingSkills: string[];
  score: number;
}

export const helpMatchingService = {
  async findExperts(
    requestId: string,
    limit = 3,
  ): Promise<ExpertCandidate[]> {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
    });
    if (!helpRequest) return [];

    const tags = helpRequest.tags.map((t) => t.toLowerCase());

    // Find all members of the community who have matching skills
    const members = await prisma.membership.findMany({
      where: {
        communityId: helpRequest.communityId,
        userId: { not: helpRequest.authorId },
      },
      include: {
        user: {
          include: {
            profile: true,
            helpResponses: {
              include: { request: true },
            },
          },
        },
      },
    });

    const candidates: ExpertCandidate[] = members
      .filter((m) => m.user.profile)
      .map((m) => {
        const user = m.user;
        const skills = (user.profile?.skills ?? []).map((s) => s.toLowerCase());

        // Skill match - how many of the request tags match their skills
        const matchingSkills = tags.filter((tag) =>
          skills.some((skill) => skill.includes(tag) || tag.includes(skill)),
        );

        // Previous help interactions bonus
        const helpHistory = user.helpResponses.filter(
          (r) => r.request.communityId === helpRequest.communityId,
        ).length;

        // Activity score: recent interactions
        const score = matchingSkills.length * 3 + helpHistory * 1;

        return {
          userId: user.id,
          name: user.name,
          image: user.image,
          matchingSkills: matchingSkills.map(
            (tag) => user.profile?.skills.find((s) => s.toLowerCase().includes(tag)) ?? tag,
          ),
          score,
        };
      })
      .filter((c) => c.matchingSkills.length > 0);

    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  async notifyExperts(requestId: string) {
    const experts = await helpMatchingService.findExperts(requestId);
    // In a real system this would send emails/push notifications.
    // For the MVP we just return the list and it can be displayed in-UI.
    return experts;
  },
};
