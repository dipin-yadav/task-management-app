import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_USER_ID,
  TEST_OTHER_USER_ID,
} from "~/test/trpc";

describe("Security: Information Disclosure Protection", () => {
  describe("project.getById", () => {
    it("masks email addresses for regular MEMBERS", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db); // Caller ID: TEST_USER_ID

      // 1. Caller is a MEMBER
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "MEMBER",
      });

      // 2. Project data includes other members
      const mockProject = {
        id: TEST_PROJECT_ID,
        name: "Secret Project",
        ownerId: TEST_OTHER_USER_ID,
        members: [
          {
            id: "membership-1",
            userId: TEST_USER_ID,
            user: { id: TEST_USER_ID, name: "Me", email: "me@example.com", image: null },
            role: "MEMBER",
          },
          {
            id: "membership-2",
            userId: TEST_OTHER_USER_ID,
            user: { id: TEST_OTHER_USER_ID, name: "Other", email: "other@example.com", image: null },
            role: "OWNER",
          },
        ],
        owner: { id: TEST_OTHER_USER_ID, name: "Other", email: "other@example.com", image: null },
      };
      
      db.project.findUnique.mockResolvedValueOnce(mockProject);
      db.task.groupBy.mockResolvedValue([]);

      const result = await caller.project.getById({ id: TEST_PROJECT_ID });

      // Verification: Caller can see their own email
      const myMembership = result.members.find(m => m.userId === TEST_USER_ID);
      expect(myMembership?.user.email).toBe("me@example.com");

      // Verification: Caller CANNOT see other members' email
      const otherMembership = result.members.find(m => m.userId === TEST_OTHER_USER_ID);
      expect(otherMembership?.user.email).toBeNull();

      // Verification: Caller CANNOT see owner's email
      expect(result.owner.email).toBeNull();
    });

    it("allows ADMINS to see all email addresses", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db);

      // 1. Caller is an ADMIN
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "ADMIN",
      });

      const mockProject = {
        id: TEST_PROJECT_ID,
        name: "Shared Project",
        ownerId: TEST_OTHER_USER_ID,
        members: [
          {
            id: "membership-2",
            userId: TEST_OTHER_USER_ID,
            user: { id: TEST_OTHER_USER_ID, name: "Other", email: "other@example.com", image: null },
            role: "OWNER",
          },
        ],
        owner: { id: TEST_OTHER_USER_ID, name: "Other", email: "other@example.com", image: null },
      };
      
      db.project.findUnique.mockResolvedValueOnce(mockProject);
      db.task.groupBy.mockResolvedValue([]);

      const result = await caller.project.getById({ id: TEST_PROJECT_ID });

      // Verification: ADMIN can see other members' email
      const otherMembership = result.members.find(m => m.userId === TEST_OTHER_USER_ID);
      expect(otherMembership?.user.email).toBe("other@example.com");
    });
  });
});
