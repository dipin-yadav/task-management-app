import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_OTHER_USER_ID,
  TEST_PROJECT_ID,
  TEST_USER_ID,
} from "~/test/trpc";

describe("project router", () => {
  it("creates a project and adds the caller as owner", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const project = {
      id: TEST_PROJECT_ID,
      name: "Launch Plan",
      description: "Roadmap work",
      ownerId: TEST_USER_ID,
      members: [{ userId: TEST_USER_ID, role: "OWNER" }],
    };
    db.project.create.mockResolvedValue(project);

    const result = await caller.project.create({
      name: "Launch Plan",
      description: "Roadmap work",
    });

    expect(db.project.create).toHaveBeenCalledWith({
      data: {
        name: "Launch Plan",
        description: "Roadmap work",
        ownerId: TEST_USER_ID,
        members: {
          create: {
            userId: TEST_USER_ID,
            role: "OWNER",
          },
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });
    expect(result).toBe(project);
  });

  it("lists projects for the current member", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const projects = [{ id: TEST_PROJECT_ID, name: "Launch Plan" }];
    db.project.findMany.mockResolvedValue(projects);

    const result = await caller.project.list();

    expect(db.project.findMany).toHaveBeenCalledWith({
      where: {
        members: {
          some: { userId: TEST_USER_ID },
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
    expect(result).toBe(projects);
  });

  it("updates a project when the caller is an admin", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const updatedProject = {
      id: TEST_PROJECT_ID,
      name: "Updated Launch Plan",
      description: "Roadmap work",
      ownerId: TEST_USER_ID,
    };
    db.project.findUnique.mockResolvedValue({
      id: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
    });
    db.projectMember.findUnique.mockResolvedValue({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "ADMIN",
    });
    db.project.update.mockResolvedValue(updatedProject);

    const result = await caller.project.update({
      id: TEST_PROJECT_ID,
      name: "Updated Launch Plan",
    });

    expect(db.projectMember.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_userId: { projectId: TEST_PROJECT_ID, userId: TEST_USER_ID },
      },
    });
    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: TEST_PROJECT_ID },
      data: { name: "Updated Launch Plan" },
    });
    expect(result).toBe(updatedProject);
  });

  it("checks membership before loading project details", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue(null);

    await expect(
      caller.project.getById({ id: TEST_PROJECT_ID }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.project.findUnique).not.toHaveBeenCalled();
    expect(db.task.groupBy).not.toHaveBeenCalled();
  });

  it("checks edit authorization before looking up the project", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue(null);

    await expect(
      caller.project.update({
        id: TEST_PROJECT_ID,
        name: "Updated Launch Plan",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.project.findUnique).not.toHaveBeenCalled();
    expect(db.project.update).not.toHaveBeenCalled();
  });

  it("deletes a project when the caller is the owner", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.project.findUnique.mockResolvedValue({
      id: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
    });
    db.projectMember.findUnique.mockResolvedValue({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "OWNER",
    });
    db.project.delete.mockResolvedValue({ id: TEST_PROJECT_ID });

    await caller.project.delete({ id: TEST_PROJECT_ID });

    expect(db.project.delete).toHaveBeenCalledWith({
      where: { id: TEST_PROJECT_ID },
    });
  });

  it("checks owner authorization before looking up a project to delete", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "MEMBER",
    });

    await expect(
      caller.project.delete({ id: TEST_PROJECT_ID }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.project.findUnique).not.toHaveBeenCalled();
    expect(db.project.delete).not.toHaveBeenCalled();
  });

  it("prevents admins from adding a new admin member", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "ADMIN",
    });

    await expect(
      caller.project.addMember({
        projectId: TEST_PROJECT_ID,
        email: "new-admin@example.com",
        role: "ADMIN",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.projectMember.create).not.toHaveBeenCalled();
  });

  it("allows owners to add a new admin member", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const member = {
      id: "clx00000000000000000000008",
      projectId: TEST_PROJECT_ID,
      userId: TEST_OTHER_USER_ID,
      role: "ADMIN",
    };
    db.projectMember.findUnique
      .mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "OWNER",
      })
      .mockResolvedValueOnce(null);
    db.user.findUnique.mockResolvedValue({
      id: TEST_OTHER_USER_ID,
      email: "new-admin@example.com",
    });
    db.projectMember.create.mockResolvedValue(member);

    const result = await caller.project.addMember({
      projectId: TEST_PROJECT_ID,
      email: "new-admin@example.com",
      role: "ADMIN",
    });

    expect(db.projectMember.create).toHaveBeenCalledWith({
      data: {
        projectId: TEST_PROJECT_ID,
        userId: TEST_OTHER_USER_ID,
        role: "ADMIN",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
    expect(result).toBe(member);
  });

  it("throws a NOT_FOUND error when adding a member with a non-existent email", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "OWNER",
    });
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      caller.project.addMember({
        projectId: TEST_PROJECT_ID,
        email: "does-not-exist@example.com",
        role: "MEMBER",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Member could not be added to the project",
    });

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "does-not-exist@example.com" },
    });
    expect(db.projectMember.create).not.toHaveBeenCalled();
  });
});
