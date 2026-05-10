import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_USER_ID,
} from "~/test/trpc";

describe("Security: Account Enumeration Protection", () => {
  describe("project.addMember", () => {
    it("returns a generic error message when user is not found", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db);
      
      // Setup: Caller is owner
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "OWNER",
      });
      
      // Setup: User to add is not found
      db.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.project.addMember({
          projectId: TEST_PROJECT_ID,
          email: "unknown@example.com",
          role: "MEMBER",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Member could not be added to the project",
      });
      
      expect(db.user.findUnique).toHaveBeenCalled();
    });

    it("returns the SAME generic error message when user is already a member", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db);
      
      // Setup: Caller is owner
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "OWNER",
      });
      
      // Setup: User is found
      db.user.findUnique.mockResolvedValueOnce({ id: "other-user-id", email: "existing@example.com" });
      
      // Setup: User is already a member
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: "other-user-id",
        role: "MEMBER",
        deletedAt: null,
      });

      await expect(
        caller.project.addMember({
          projectId: TEST_PROJECT_ID,
          email: "existing@example.com",
          role: "MEMBER",
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Member could not be added to the project",
      });
      
      expect(db.user.findUnique).toHaveBeenCalled();
    });
  });
});
