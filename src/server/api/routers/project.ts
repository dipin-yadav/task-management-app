import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type ProjectRole } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type PrismaClient } from "@prisma/client";

// ──────────────────────────────────
// Shared authorization helper
// ──────────────────────────────────

/**
 * Verify that a user is a member of the given project and optionally
 * check that they hold one of the required roles.
 *
 * Returns the ProjectMember record on success; throws on failure.
 */
export async function verifyProjectMembership(
  db: PrismaClient,
  projectId: string,
  userId: string,
  requiredRoles?: ProjectRole[],
) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this project",
    });
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires one of the following roles: ${requiredRoles.join(", ")}`,
    });
  }

  return membership;
}

// ──────────────────────────────────
// Project Router
// ──────────────────────────────────

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project. The caller is automatically added as OWNER.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
        include: {
          members: { include: { user: true } },
        },
      });

      return project;
    }),

  /**
   * List all projects the current user is a member of.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        members: {
          some: { userId: ctx.session.user.id },
        },
      },
      include: {
        _count: { select: { members: true, tasks: true } },
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects;
  }),

  /**
   * Get a single project by ID with members and task count by status.
   * Caller must be a member.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Verify membership
      await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id);

      // Get task counts grouped by status
      const taskCounts = await ctx.db.task.groupBy({
        by: ["status"],
        where: { projectId: input.id },
        _count: { status: true },
      });

      const taskCountMap = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      };

      for (const group of taskCounts) {
        taskCountMap[group.status] = group._count.status;
      }

      return {
        ...project,
        taskCounts: taskCountMap,
      };
    }),

  /**
   * Update project name/description. Requires OWNER or ADMIN role.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check OWNER or ADMIN
      await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id, [
        "OWNER",
        "ADMIN",
      ]);

      const updated = await ctx.db.project.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
        },
      });

      return updated;
    }),

  /**
   * Delete a project. Only OWNER can delete. Cascade handles cleanup.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id, [
        "OWNER",
      ]);

      await ctx.db.project.delete({ where: { id: input.id } });
    }),

  /**
   * Add a member to the project by email. OWNER/ADMIN can add members.
   */
  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller has OWNER/ADMIN role
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        ["OWNER", "ADMIN"],
      );

      // Find user by email
      const userToAdd = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!userToAdd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found with that email address",
        });
      }

      // Check if already a member
      const existingMembership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this project",
        });
      }

      const member = await ctx.db.projectMember.create({
        data: {
          projectId: input.projectId,
          userId: userToAdd.id,
          role: input.role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      return member;
    }),

  /**
   * Remove a member from the project. OWNER/ADMIN can remove.
   * Cannot remove the OWNER.
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        userId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller has OWNER/ADMIN role
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        ["OWNER", "ADMIN"],
      );

      // Find the member to remove
      const memberToRemove = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });

      if (!memberToRemove) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this project",
        });
      }

      // Cannot remove the OWNER
      if (memberToRemove.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove the project owner",
        });
      }

      await ctx.db.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });
    }),

  /**
   * Change a member's role. Only OWNER can change roles.
   * OWNER cannot change their own role.
   */
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        userId: z.string().cuid(),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only OWNER can change roles
      await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        ["OWNER"],
      );

      // Cannot change own role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change your own role",
        });
      }

      // Verify target is a member
      const targetMember = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this project",
        });
      }

      const updated = await ctx.db.projectMember.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      return updated;
    }),
});
