import { describe, expect, it } from "vitest";
import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_USER_ID,
  TEST_OTHER_USER_ID,
  TEST_TASK_ID,
} from "~/test/trpc";

describe("Security: Task Deletion Protection", () => {
  it("allows the task creator (MEMBER) to delete their own task", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db); // Caller ID: TEST_USER_ID

    // 1. Task exists and was created by the caller
    db.task.findUnique.mockResolvedValueOnce({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
      creatorId: TEST_USER_ID,
    });

    // 2. Caller is a MEMBER
    db.projectMember.findUnique.mockResolvedValueOnce({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "MEMBER",
    });

    db.task.delete.mockResolvedValue({ id: TEST_TASK_ID });

    await caller.task.delete({ id: TEST_TASK_ID });

    expect(db.task.delete).toHaveBeenCalledWith({ where: { id: TEST_TASK_ID } });
  });

  it("prevents a MEMBER from deleting someone else's task", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);

    // 1. Task exists but was created by someone else
    db.task.findUnique.mockResolvedValueOnce({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
      creatorId: TEST_OTHER_USER_ID,
    });

    // 2. Caller is a MEMBER
    db.projectMember.findUnique.mockResolvedValueOnce({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "MEMBER",
    });

    await expect(
      caller.task.delete({ id: TEST_TASK_ID }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You do not have permission to delete this task",
    });

    expect(db.task.delete).not.toHaveBeenCalled();
  });

  it("allows an ADMIN to delete someone else's task", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);

    // 1. Task exists and was created by someone else
    db.task.findUnique.mockResolvedValueOnce({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
      creatorId: TEST_OTHER_USER_ID,
    });

    // 2. Caller is an ADMIN
    db.projectMember.findUnique.mockResolvedValueOnce({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "ADMIN",
    });

    db.task.delete.mockResolvedValue({ id: TEST_TASK_ID });

    await caller.task.delete({ id: TEST_TASK_ID });

    expect(db.task.delete).toHaveBeenCalled();
  });

  it("allows the OWNER to delete someone else's task", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);

    // 1. Task exists and was created by someone else
    db.task.findUnique.mockResolvedValueOnce({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
      creatorId: TEST_OTHER_USER_ID,
    });

    // 2. Caller is the OWNER
    db.projectMember.findUnique.mockResolvedValueOnce({
      projectId: TEST_PROJECT_ID,
      userId: TEST_USER_ID,
      role: "OWNER",
    });

    db.task.delete.mockResolvedValue({ id: TEST_TASK_ID });

    await caller.task.delete({ id: TEST_TASK_ID });

    expect(db.task.delete).toHaveBeenCalled();
  });
});
