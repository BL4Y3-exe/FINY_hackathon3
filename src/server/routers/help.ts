import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { helpMatchingService } from "@/server/services/helpMatchingService";

export const helpRouter = router({
  // List help requests for a community
  list: protectedProcedure
    .input(
      z.object({
        communityId: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.helpRequest.findMany({
        where: {
          communityId: input.communityId,
          ...(input.status && { status: input.status }),
          ...(input.tags?.length && { tags: { hasSome: input.tags } }),
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get a single help request with responses
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.helpRequest.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, name: true, image: true } },
          responses: {
            include: {
              helper: { select: { id: true, name: true, image: true, profile: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      return request;
    }),

  // Create a help request
  create: protectedProcedure
    .input(
      z.object({
        communityId: z.string(),
        title: z.string().min(5).max(120),
        description: z.string().min(10).max(2000),
        tags: z.array(z.string()).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.helpRequest.create({
        data: {
          authorId: ctx.session.user.id,
          communityId: input.communityId,
          title: input.title,
          description: input.description,
          tags: input.tags,
        },
      });

      // Find and attach experts (non-blocking)
      helpMatchingService.notifyExperts(request.id).catch(console.error);

      return request;
    }),

  // Post a response to a help request
  respond: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        message: z.string().min(5).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.helpRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      const response = await ctx.prisma.helpResponse.create({
        data: {
          requestId: input.requestId,
          helperId: ctx.session.user.id,
          message: input.message,
        },
      });

      // Update request status to IN_PROGRESS if still open
      if (request.status === "OPEN") {
        await ctx.prisma.helpRequest.update({
          where: { id: input.requestId },
          data: { status: "IN_PROGRESS" },
        });
      }

      // Record help interaction and upsert connection
      await ctx.prisma.interaction.create({
        data: {
          type: "HELP",
          actorId: ctx.session.user.id,
          targetId: request.authorId,
          communityId: request.communityId,
        },
      });

      const [a, b] = [ctx.session.user.id, request.authorId].sort();
      await ctx.prisma.connection.upsert({
        where: { userAId_userBId_type: { userAId: a, userBId: b, type: "HELP" } },
        update: { weight: { increment: 1 } },
        create: { userAId: a, userBId: b, type: "HELP", weight: 1 },
      });

      return response;
    }),

  // Mark a request as resolved
  resolve: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.helpRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      if (request.authorId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.helpRequest.update({
        where: { id: input.requestId },
        data: { status: "RESOLVED" },
      });
    }),

  // Get matching experts for a request
  getExperts: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return helpMatchingService.findExperts(input.requestId);
    }),
});
