import { describe, expect, it } from "vitest";

import {
  createMockCaller,
  createMockDb,
  TEST_PROJECT_ID,
  TEST_USER_ID,
  TEST_OTHER_USER_ID,
} from "~/test/trpc";

describe("Security: Horizontal Privilege Escalation Protection", () => {
  describe("project.removeMember", () => {
    it("allows ADMIN to remove a regular MEMBER", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db); // Caller ID: TEST_USER_ID
      
      const targetUserId = TEST_OTHER_USER_ID;

      // 1. Caller is ADMIN
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "ADMIN",
      });

      // 2. Member to remove is MEMBER
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: targetUserId,
        role: "MEMBER",
      });

      db.projectMember.delete.mockResolvedValue({ projectId: TEST_PROJECT_ID, userId: targetUserId });

      await caller.project.removeMember({
        projectId: TEST_PROJECT_ID,
        userId: targetUserId,
      });

      expect(db.projectMember.delete).toHaveBeenCalled();
    });

    it("prevents ADMIN from removing another ADMIN", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db);
      
      const otherAdminId = "clx00000000000000000000008";

      // 1. Caller is ADMIN
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "ADMIN",
      });

      // 2. Member to remove is also ADMIN
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: otherAdminId,
        role: "ADMIN",
      });

      await expect(
        caller.project.removeMember({
          projectId: TEST_PROJECT_ID,
          userId: otherAdminId,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Only project owner can remove other members with ADMIN role",
      });

      expect(db.projectMember.delete).not.toHaveBeenCalled();
    });

    it("allows OWNER to remove an ADMIN", async () => {
      const db = createMockDb();
      const caller = createMockCaller(db);
      
      const adminToRemoveId = "clx00000000000000000000009";

      // 1. Caller is OWNER
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        role: "OWNER",
      });

      // 2. Member to remove is ADMIN
      db.projectMember.findUnique.mockResolvedValueOnce({
        projectId: TEST_PROJECT_ID,
        userId: adminToRemoveId,
        role: "ADMIN",
      });

      db.projectMember.delete.mockResolvedValue({ projectId: TEST_PROJECT_ID, userId: adminToRemoveId });

      await caller.project.removeMember({
        projectId: TEST_PROJECT_ID,
        userId: adminToRemoveId,
      });

      expect(db.projectMember.delete).toHaveBeenCalled();
    });

    it("allows ADMIN to remove themselves (leave project)", async () => {
        const db = createMockDb();
        const caller = createMockCaller(db);
        
        // 1. Caller is ADMIN
        db.projectMember.findUnique.mockResolvedValueOnce({
          projectId: TEST_PROJECT_ID,
          userId: TEST_USER_ID,
          role: "ADMIN",
        });
  
        // 2. Member to remove is THEMSELVES
        db.projectMember.findUnique.mockResolvedValueOnce({
          projectId: TEST_PROJECT_ID,
          userId: TEST_USER_ID,
          role: "ADMIN",
        });
  
        db.projectMember.delete.mockResolvedValue({ projectId: TEST_PROJECT_ID, userId: TEST_USER_ID });
  
        await caller.project.removeMember({
          projectId: TEST_PROJECT_ID,
          userId: TEST_USER_ID,
        });
  
        expect(db.projectMember.delete).toHaveBeenCalled();
      });
  });
});
