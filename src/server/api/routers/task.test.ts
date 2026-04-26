import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_TASK_ID,
  TEST_USER_ID,
} from "~/test/trpc";

const membership = {
  projectId: TEST_PROJECT_ID,
  userId: TEST_USER_ID,
  role: "MEMBER",
};

const expectedTaskInclude = {
  tags: { include: { tag: true } },
  assignee: {
    select: { id: true, name: true, email: true, image: true },
  },
  creator: {
    select: { id: true, name: true, email: true, image: true },
  },
};

describe("task router", () => {
  it("creates a task in a project for a member", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const task = {
      id: TEST_TASK_ID,
      title: "Write tests",
      projectId: TEST_PROJECT_ID,
      creatorId: TEST_USER_ID,
      priority: "HIGH",
    };
    db.projectMember.findUnique.mockResolvedValue(membership);
    db.task.create.mockResolvedValue(task);

    const result = await caller.task.create({
      projectId: TEST_PROJECT_ID,
      title: "Write tests",
      priority: "HIGH",
    });

    expect(db.task.create).toHaveBeenCalledWith({
      data: {
        title: "Write tests",
        description: undefined,
        priority: "HIGH",
        deadline: undefined,
        projectId: TEST_PROJECT_ID,
        creatorId: TEST_USER_ID,
        assigneeId: undefined,
      },
      include: expectedTaskInclude,
    });
    expect(result).toBe(task);
  });

  it("lists project tasks with filters", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const tasks = [{ id: TEST_TASK_ID, title: "Write tests" }];
    db.projectMember.findUnique.mockResolvedValue(membership);
    db.task.findMany.mockResolvedValue(tasks);

    const result = await caller.task.list({
      projectId: TEST_PROJECT_ID,
      status: "TODO",
      search: "tests",
    });

    expect(db.task.findMany).toHaveBeenCalledWith({
      where: {
        projectId: TEST_PROJECT_ID,
        status: "TODO",
        OR: [
          { title: { contains: "tests", mode: "insensitive" } },
          { description: { contains: "tests", mode: "insensitive" } },
        ],
      },
      include: expectedTaskInclude,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    expect(result).toBe(tasks);
  });

  it("updates a task and syncs tag changes", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    const updatedTask = {
      id: TEST_TASK_ID,
      title: "Updated task",
      projectId: TEST_PROJECT_ID,
    };
    db.task.findUnique.mockResolvedValue({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
    });
    db.projectMember.findUnique.mockResolvedValue(membership);
    db.task.update.mockResolvedValue(updatedTask);

    const result = await caller.task.update({
      id: TEST_TASK_ID,
      title: "Updated task",
      tagIds: [],
    });

    expect(db.taskTag.deleteMany).toHaveBeenCalledWith({
      where: { taskId: TEST_TASK_ID },
    });
    expect(db.task.update).toHaveBeenCalledWith({
      where: { id: TEST_TASK_ID },
      data: { title: "Updated task" },
      include: expectedTaskInclude,
    });
    expect(result).toBe(updatedTask);
  });

  it("deletes a task from a project for a member", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.task.findUnique.mockResolvedValue({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
    });
    db.projectMember.findUnique.mockResolvedValue(membership);
    db.task.delete.mockResolvedValue({ id: TEST_TASK_ID });

    await caller.task.delete({ id: TEST_TASK_ID });

    expect(db.task.delete).toHaveBeenCalledWith({
      where: { id: TEST_TASK_ID },
    });
  });

  it("blocks non-members from listing project tasks", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.projectMember.findUnique.mockResolvedValue(null);

    await expect(caller.task.list({ projectId: TEST_PROJECT_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.task.findMany).not.toHaveBeenCalled();
  });
});
