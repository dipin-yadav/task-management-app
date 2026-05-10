import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient, type ProjectRole, ActivityType } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logActivity } from "./history";

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
  const membership = await db.projectMember.findFirst({
    where: { 
      projectId, 
      userId,
      deletedAt: null,
      project: { deletedAt: null }
    },
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
        deletedAt: null,
        members: {
          some: { userId: ctx.session.user.id, deletedAt: null },
        },
      },
      include: {
        _count: { select: { members: true, tasks: true } },
        owner: {
          select: { id: true, name: true, image: true },
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
      const callerMembership = await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id);

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

      // Mitigation: Mask emails for users who are not OWNER or ADMIN
      const isPrivileged = callerMembership.role === "OWNER" || callerMembership.role === "ADMIN";

      const sanitizedMembers = project.members.map((member) => ({
        ...member,
        user: {
          ...member.user,
          email:
            isPrivileged || member.userId === ctx.session.user.id
              ? member.user.email
              : null,
        },
      }));

      const sanitizedOwner = {
        ...project.owner,
        email:
          isPrivileged || project.ownerId === ctx.session.user.id
            ? project.owner.email
            : null,
      };

      // Get task counts grouped by status
      const taskCounts = await ctx.db.task.groupBy({
        by: ["status"],
        where: { projectId: input.id, deletedAt: null },
        _count: { status: true },
      });

      const taskCountMap = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      };

      for (const group of taskCounts) {
        const castedGroup = group as unknown as { _count: { status: number } };
        taskCountMap[group.status] = castedGroup._count.status;
      }

      return {
        ...project,
        members: sanitizedMembers,
        owner: sanitizedOwner,
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
      // Check OWNER or ADMIN
      await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id, [
        "OWNER",
        "ADMIN",
      ]);

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
      await verifyProjectMembership(ctx.db, input.id, ctx.session.user.id, [
        "OWNER",
      ]);

      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await ctx.db.project.update({ 
        where: { id: input.id },
        data: { deletedAt: new Date() }
      });
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
      const callerMembership = await verifyProjectMembership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
        ["OWNER", "ADMIN"],
      );

      if (input.role === "ADMIN" && callerMembership.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owner can add members with ADMIN role",
        });
      }

      // Find user by email
      const userToAdd = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!userToAdd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member could not be added to the project",
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

      if (existingMembership?.deletedAt === null) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Member could not be added to the project",
        });
      }

      let member;
      if (existingMembership) {
        member = await ctx.db.projectMember.update({
          where: { id: existingMembership.id },
          data: { role: input.role, deletedAt: null },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        });
      } else {
        member = await ctx.db.projectMember.create({
          data: {
            projectId: input.projectId,
            userId: userToAdd.id,
            role: input.role,
          },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        });
      }

      await logActivity(ctx.db, {
        type: ActivityType.MEMBER_ADDED,
        message: `Added member ${userToAdd.name ?? userToAdd.email ?? "Unknown User"} as ${input.role}`,
        projectId: input.projectId,
        userId: ctx.session.user.id,
        metadata: {
          addedUserId: userToAdd.id,
          role: input.role,
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
      const callerMembership = await verifyProjectMembership(
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
        include: { user: true },
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

      // Only OWNER can remove another ADMIN (except self-removal)
      if (
        memberToRemove.role === "ADMIN" &&
        callerMembership.role !== "OWNER" &&
        memberToRemove.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project owner can remove other members with ADMIN role",
        });
      }

      await ctx.db.projectMember.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { deletedAt: new Date() },
      });

      const removedUserName = memberToRemove.user.name ?? memberToRemove.user.email ?? "Unknown User";

      await logActivity(ctx.db, {
        type: ActivityType.MEMBER_REMOVED,
        message: `Removed member ${removedUserName}`,
        projectId: input.projectId,
        userId: ctx.session.user.id,
        metadata: {
          removedUserId: input.userId,
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

      await logActivity(ctx.db, {
        type: ActivityType.MEMBER_ROLE_CHANGED,
        message: `Changed ${updated.user.name ?? updated.user.email ?? "Unknown User"}'s role to ${input.role}`,
        projectId: input.projectId,
        userId: ctx.session.user.id,
        metadata: {
          targetUserId: input.userId,
          oldRole: targetMember.role,
          newRole: input.role,
        },
      });

      return updated;
    }),
});
