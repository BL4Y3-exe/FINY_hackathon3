import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";

export const profileRouter = router({
  // Get current user's profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    return user;
  }),

  // Get any user's public profile
  get: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          profile: true,
        },
      });
    }),

  // Upsert current user's profile
  upsert: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80).optional(),
        bio: z.string().max(500).optional(),
        goals: z.string().max(500).optional(),
        timezone: z.string().optional(),
        skills: z.array(z.string().min(1).max(50)).max(20).optional(),
        interests: z.array(z.string().min(1).max(50)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Update user name if provided
      if (input.name) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { name: input.name },
        });
      }

      const profile = await ctx.prisma.profile.upsert({
        where: { userId },
        update: {
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.goals !== undefined && { goals: input.goals }),
          ...(input.timezone && { timezone: input.timezone }),
          ...(input.skills && { skills: input.skills }),
          ...(input.interests && { interests: input.interests }),
        },
        create: {
          userId,
          bio: input.bio,
          goals: input.goals,
          timezone: input.timezone ?? "UTC",
          skills: input.skills ?? [],
          interests: input.interests ?? [],
        },
      });

      return profile;
    }),
});
