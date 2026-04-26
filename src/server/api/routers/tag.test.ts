import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_TAG_ID,
  TEST_TASK_ID,
  TEST_USER_ID,
} from "~/test/trpc";

const membership = {
  projectId: TEST_PROJECT_ID,
  userId: TEST_USER_ID,
  role: "MEMBER",
};

describe("tag router", () => {
  it("returns not found when adding a missing tag to a task", async () => {
    const db = createMockDb();
    const caller = createMockCaller(db);
    db.task.findUnique.mockResolvedValue({
      id: TEST_TASK_ID,
      projectId: TEST_PROJECT_ID,
    });
    db.projectMember.findUnique.mockResolvedValue(membership);
    db.tag.findUnique.mockResolvedValue(null);

    await expect(
      caller.tag.addToTask({ taskId: TEST_TASK_ID, tagId: TEST_TAG_ID }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(db.taskTag.findUnique).not.toHaveBeenCalled();
    expect(db.taskTag.create).not.toHaveBeenCalled();
  });
});
