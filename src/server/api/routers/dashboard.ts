import { z } from "zod";
import { TaskStatus } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const dashboardTaskInclude = {
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  tags: { include: { tag: true } },
} as const;

const emptyStats = {
  todo: 0,
  inProgress: 0,
  inReview: 0,
  done: 0,
  total: 0,
};

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const taskCounts = await ctx.db.task.groupBy({
      by: ["status"],
      where: {
        project: {
          members: { some: { userId: ctx.session.user.id } },
        },
      },
      _count: { status: true },
    });

    const stats = { ...emptyStats };

    for (const group of taskCounts) {
      const count = group._count.status;
      if (group.status === "TODO") stats.todo = count;
      if (group.status === "IN_PROGRESS") stats.inProgress = count;
      if (group.status === "IN_REVIEW") stats.inReview = count;
      if (group.status === "DONE") stats.done = count;
    }

    stats.total = stats.todo + stats.inProgress + stats.inReview + stats.done;

    return stats;
  }),

  getUpcomingDeadlines: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(60).default(7) }).optional())
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const dueBefore = new Date(now);
      dueBefore.setDate(dueBefore.getDate() + (input?.days ?? 7));

      return ctx.db.task.findMany({
        where: {
          deadline: { gte: now, lte: dueBefore },
          status: { not: "DONE" },
          project: {
            members: { some: { userId: ctx.session.user.id } },
          },
        },
        include: dashboardTaskInclude,
        orderBy: { deadline: "asc" },
        take: 8,
      });
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(8) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          project: {
            members: { some: { userId: ctx.session.user.id } },
          },
        },
        include: dashboardTaskInclude,
        orderBy: { updatedAt: "desc" },
        take: input?.limit ?? 8,
      });
    }),

  getMyTasks: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(TaskStatus).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          assigneeId: ctx.session.user.id,
          ...(input?.status ? { status: input.status } : {}),
          project: {
            members: { some: { userId: ctx.session.user.id } },
          },
        },
        include: dashboardTaskInclude,
        orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
        take: 20,
      });
    }),
});
