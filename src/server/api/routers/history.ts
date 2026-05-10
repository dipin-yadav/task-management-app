import { z } from "zod";
import { type ActivityType, ProjectRole, type Prisma, type PrismaClient } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { verifyProjectMembership } from "./project";

export const historyRouter = createTRPCRouter({
  listProjectHistory: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const membership = await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      if (
        membership.role !== ProjectRole.OWNER &&
        membership.role !== ProjectRole.ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Owners and Admins can view project history",
        });
      }

      return ctx.db.activity.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          task: { select: { id: true, title: true } },
        },
      });
    }),

  listTaskHistory: protectedProcedure
    .input(z.object({ taskId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
        select: { projectId: true, assigneeId: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const membership = await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      const isAuthorized =
        membership.role === ProjectRole.OWNER ||
        membership.role === ProjectRole.ADMIN ||
        task.assigneeId === ctx.session.user.id;

      if (!isAuthorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this task's history",
        });
      }

      return ctx.db.activity.findMany({
        where: { taskId: input.taskId },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });
    }),
});

/**
 * Helper function to log an activity.
 * Can be used within tRPC procedures or directly if db client is available.
 */
export const logActivity = async (
  db: PrismaClient | Prisma.TransactionClient,
  data: {
    type: ActivityType;
    message: string;
    projectId: string;
    taskId?: string;
    userId: string;
    metadata?: Prisma.InputJsonValue;
  },
) => {
  return db.activity.create({
    data: {
      type: data.type,
      message: data.message,
      projectId: data.projectId,
      taskId: data.taskId,
      userId: data.userId,
      metadata: data.metadata ?? {},
    },
  });
};
