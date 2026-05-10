import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TaskPriority, TaskStatus, ActivityType } from "@prisma/client";
import { logActivity } from "./history";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { verifyProjectMembership } from "./project";

const taskInclude = {
  tags: { include: { tag: true } },
  assignee: {
    select: { id: true, name: true, image: true },
  },
  creator: {
    select: { id: true, name: true, image: true },
  },
} as const;

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        title: z.string().min(1).max(200),
        description: z.string().max(5000).optional(),
        status: z.nativeEnum(TaskStatus).default("TODO"),
        priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
        deadline: z.date().optional(),
        assigneeId: z.string().cuid().optional(),
        tagIds: z.array(z.string().cuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      if (input.assigneeId) {
        await verifyProjectMembership(
          ctx.db,
          input.projectId,
          input.assigneeId,
        );
      }

      if (input.tagIds && input.tagIds.length > 0) {
        const validTagCount = await ctx.db.tag.count({
          where: { id: { in: input.tagIds }, projectId: input.projectId },
        });

        if (validTagCount !== input.tagIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more tags do not belong to this project",
          });
        }
      }

      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline,
          projectId: input.projectId,
          creatorId: ctx.session.user.id,
          assigneeId: input.assigneeId,
          ...(input.tagIds &&
            input.tagIds.length > 0 && {
              tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
            }),
        },
        include: taskInclude,
      });

      await logActivity(ctx.db, {
        type: ActivityType.TASK_CREATED,
        message: `Created task "${task.title}"`,
        projectId: task.projectId,
        taskId: task.id,
        userId: ctx.session.user.id,
      });

      return task;
    }),

  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        assigneeId: z.string().cuid().optional(),
        tagIds: z.array(z.string().cuid()).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      return ctx.db.task.findMany({
        where: {
          projectId: input.projectId,
          ...(input.status && { status: input.status }),
          ...(input.priority && { priority: input.priority }),
          ...(input.assigneeId && { assigneeId: input.assigneeId }),
          ...(input.tagIds &&
            input.tagIds.length > 0 && {
              tags: { some: { tagId: { in: input.tagIds } } },
            }),
          ...(input.search && {
            OR: [
              {
                title: { contains: input.search, mode: "insensitive" as const },
              },
              {
                description: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        include: taskInclude,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          ...taskInclude,
          project: { select: { id: true, name: true } },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );
      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        deadline: z.date().nullable().optional(),
        assigneeId: z.string().cuid().nullable().optional(),
        tagIds: z.array(z.string().cuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      if (input.assigneeId) {
        await verifyProjectMembership(ctx.db, task.projectId, input.assigneeId);
      }

      return ctx.db.$transaction(async (tx) => {
        if (input.tagIds !== undefined) {
          if (input.tagIds.length > 0) {
            const validTagCount = await tx.tag.count({
              where: { id: { in: input.tagIds }, projectId: task.projectId },
            });

            if (validTagCount !== input.tagIds.length) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "One or more tags do not belong to this project",
              });
            }
          }

          await tx.taskTag.deleteMany({ where: { taskId: input.id } });
          if (input.tagIds.length > 0) {
            await tx.taskTag.createMany({
              data: input.tagIds.map((tagId) => ({ taskId: input.id, tagId })),
            });
          }
        }

        const updatedTask = await tx.task.update({
          where: { id: input.id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.priority !== undefined && { priority: input.priority }),
            ...(input.deadline !== undefined && { deadline: input.deadline }),
            ...(input.assigneeId !== undefined && {
              assigneeId: input.assigneeId,
            }),
          },
          include: taskInclude,
        });

        const activityType =
          input.status !== undefined
            ? ActivityType.TASK_STATUS_CHANGED
            : input.priority !== undefined
              ? ActivityType.TASK_PRIORITY_CHANGED
              : input.assigneeId !== undefined
                ? ActivityType.TASK_ASSIGNED
                : ActivityType.TASK_UPDATED;

        let message = `Updated task "${updatedTask.title}"`;
        if (input.status !== undefined) {
          message = `Changed status of "${updatedTask.title}" to ${input.status}`;
        } else if (input.priority !== undefined) {
          message = `Changed priority of "${updatedTask.title}" to ${input.priority}`;
        } else if (input.assigneeId !== undefined) {
          message = input.assigneeId
            ? `Assigned task "${updatedTask.title}" to ${updatedTask.assignee?.name ?? "a user"}`
            : `Unassigned task "${updatedTask.title}"`;
        }

        await logActivity(tx, {
          type: activityType,
          message,
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
          userId: ctx.session.user.id,
          metadata: {
            changes: input,
          },
        });

        return updatedTask;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const callerMembership = await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      // Only OWNER, ADMIN, or the task creator can delete the task
      const isAuthorized =
        callerMembership.role === "OWNER" ||
        callerMembership.role === "ADMIN" ||
        task.creatorId === ctx.session.user.id;

      if (!isAuthorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this task",
        });
      }

      await ctx.db.task.delete({ where: { id: input.id } });

      await logActivity(ctx.db, {
        type: ActivityType.TASK_DELETED,
        message: `Deleted task "${task.title}"`,
        projectId: task.projectId,
        userId: ctx.session.user.id,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
        },
      });
    }),

  assign: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        assigneeId: z.string().cuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      if (input.assigneeId) {
        await verifyProjectMembership(ctx.db, task.projectId, input.assigneeId);
      }

      const updatedTask = await ctx.db.task.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
        include: taskInclude,
      });

      await logActivity(ctx.db, {
        type: ActivityType.TASK_ASSIGNED,
        message: input.assigneeId
          ? `Assigned task "${updatedTask.title}" to ${updatedTask.assignee?.name ?? "a user"}`
          : `Unassigned task "${updatedTask.title}"`,
        projectId: updatedTask.projectId,
        taskId: updatedTask.id,
        userId: ctx.session.user.id,
        metadata: {
          assigneeId: input.assigneeId,
        },
      });

      return updatedTask;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.nativeEnum(TaskStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      const updatedTask = await ctx.db.task.update({
        where: { id: input.id },
        data: { status: input.status },
        include: taskInclude,
      });

      await logActivity(ctx.db, {
        type: ActivityType.TASK_STATUS_CHANGED,
        message: `Changed status of "${updatedTask.title}" to ${input.status}`,
        projectId: updatedTask.projectId,
        taskId: updatedTask.id,
        userId: ctx.session.user.id,
        metadata: {
          status: input.status,
        },
      });

      return updatedTask;
    }),
});
