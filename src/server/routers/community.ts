import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { generateSlug } from "@/lib/utils";

export const communityRouter = router({
  // List all communities
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get a single community
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { slug: input.slug },
        include: {
          owner: { select: { id: true, name: true, image: true } },
          _count: {
            select: { memberships: true, helpRequests: true, matches: true },
          },
        },
      });
      if (!community) throw new TRPCError({ code: "NOT_FOUND" });
      return community;
    }),

  // Create a community
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let slug = generateSlug(input.name);

      // Ensure slug uniqueness
      const existing = await ctx.prisma.community.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const community = await ctx.prisma.community.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          ownerId: userId,
          memberships: {
            create: { userId, role: "ADMIN" },
          },
        },
      });
      return community;
    }),

  // Join a community
  join: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.prisma.membership.upsert({
        where: { userId_communityId: { userId, communityId: input.communityId } },
        update: {},
        create: { userId, communityId: input.communityId, role: "MEMBER" },
      });

      // Trigger buddy assignment for new member
      const { buddyAssignmentService } = await import("@/server/services/buddyAssignmentService");
      await buddyAssignmentService.assignBuddy(userId, input.communityId);

      return membership;
    }),

  // Leave a community
  leave: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.prisma.membership.deleteMany({
        where: { userId, communityId: input.communityId },
      });
      return { success: true };
    }),

  // Get communities the current user belongs to
  myMemberships: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.prisma.membership.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            _count: { select: { memberships: true } },
          },
        },
      },
    });
  }),

  // Get members of a community
  members: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.membership.findMany({
        where: { communityId: input.communityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
              profile: true,
            },
          },
        },
      });
    }),
});
