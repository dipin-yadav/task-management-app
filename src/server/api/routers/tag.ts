import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { verifyProjectMembership } from "./project";

// ──────────────────────────────────
// Tag Router
// ──────────────────────────────────

export const tagRouter = createTRPCRouter({
  /**
   * Create a tag within a project. Name must be unique per project.
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        name: z.string().min(1).max(50),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .default("#6366f1"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      // Check for duplicate name within project
      const existing = await ctx.db.tag.findUnique({
        where: {
          name_projectId: { name: input.name, projectId: input.projectId },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tag with this name already exists in this project",
        });
      }

      return ctx.db.tag.create({
        data: {
          name: input.name,
          color: input.color,
          projectId: input.projectId,
        },
      });
    }),

  /**
   * List all tags for a project.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      return ctx.db.tag.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        include: { _count: { select: { tasks: true } } },
        orderBy: { name: "asc" },
      });
    }),

  /**
   * Update a tag's name or color.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(50).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findUnique({ where: { id: input.id } });

      if (!tag || tag.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      await verifyProjectMembership(ctx.db, tag.projectId, ctx.session.user.id);

      // If renaming, check uniqueness within project
      if (input.name && input.name !== tag.name) {
        const existing = await ctx.db.tag.findUnique({
          where: {
            name_projectId: { name: input.name, projectId: tag.projectId },
          },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A tag with this name already exists in this project",
          });
        }
      }

      return ctx.db.tag.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.color !== undefined && { color: input.color }),
        },
      });
    }),

  /**
   * Delete a tag. Cascade removes TaskTag associations.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findUnique({ where: { id: input.id } });

      if (!tag || tag.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      await verifyProjectMembership(ctx.db, tag.projectId, ctx.session.user.id);

      await ctx.db.tag.update({ 
        where: { id: input.id },
        data: { deletedAt: new Date() }
      });
    }),

  /**
   * Associate a tag with a task.
   */
  addToTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string().cuid(),
        tagId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
      });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      // Verify the tag belongs to the same project
      const tag = await ctx.db.tag.findUnique({ where: { id: input.tagId } });
      if (!tag || tag.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      if (tag.projectId !== task.projectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tag does not belong to this project",
        });
      }

      // Check if already associated
      const existing = await ctx.db.taskTag.findUnique({
        where: { taskId_tagId: { taskId: input.taskId, tagId: input.tagId } },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Tag is already associated with this task",
        });
      }

      return ctx.db.taskTag.create({
        data: { taskId: input.taskId, tagId: input.tagId },
        include: { tag: true },
      });
    }),

  /**
   * Remove a tag from a task.
   */
  removeFromTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string().cuid(),
        tagId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
      });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await verifyProjectMembership(
        ctx.db,
        task.projectId,
        ctx.session.user.id,
      );

      const existing = await ctx.db.taskTag.findUnique({
        where: { taskId_tagId: { taskId: input.taskId, tagId: input.tagId } },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag is not associated with this task",
        });
      }

      await ctx.db.taskTag.delete({
        where: { taskId_tagId: { taskId: input.taskId, tagId: input.tagId } },
      });
    }),
});
