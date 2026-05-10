import { beforeEach, describe, expect, it, afterAll } from "vitest";

import {
  createProject,
  createProjectMember,
  createProjectScenario,
  createUser,
} from "~/test/integration/factories";
import { createAuthenticatedCaller, createUnauthenticatedCaller } from "~/test/integration/helpers";
import { cleanupDatabase, disconnectDatabase, testDb } from "~/test/integration/setup";

describe("project router (integration)", () => {
  // Clean up database before each test to ensure isolation
  beforeEach(async () => {
    await cleanupDatabase();
  });

  // Disconnect after all tests
  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("project.create", () => {
    it("creates a project and adds caller as owner in the database", async () => {
      const { caller, user } = await createAuthenticatedCaller();

      const result = await caller.project.create({
        name: "My New Project",
        description: "A test project",
      });

      // Verify the returned data
      expect(result.name).toBe("My New Project");
      expect(result.description).toBe("A test project");
      expect(result.ownerId).toBe(user.id);

      // Verify the project was actually created in the database
      const dbProject = await testDb.project.findUnique({
        where: { id: result.id },
        include: { members: true },
      });

      expect(dbProject).not.toBeNull();
      expect(dbProject!.name).toBe("My New Project");
      expect(dbProject!.members).toHaveLength(1);
      expect(dbProject!.members[0]!.userId).toBe(user.id);
      expect(dbProject!.members[0]!.role).toBe("OWNER");
    });

    it("rejects unauthenticated requests", async () => {
      const { caller } = createUnauthenticatedCaller();

      await expect(
        caller.project.create({
          name: "Test Project",
        }),
      ).rejects.toThrow(/UNAUTHORIZED/);
    });
  });

  describe("project.list", () => {
    it("returns only projects the user is a member of", async () => {
      // Create two users with their own projects
      const user1 = await createUser({ name: "User 1" });
      const user2 = await createUser({ name: "User 2" });

      const project1 = await createProject({ name: "User 1's Project", ownerId: user1.id });
      const project2 = await createProject({ name: "User 2's Project", ownerId: user2.id });

      // User 1 should only see their own project
      const { caller: caller1 } = await createAuthenticatedCaller(user1);
      const list1 = await caller1.project.list();

      expect(list1).toHaveLength(1);
      expect(list1[0]!.id).toBe(project1.id);
      expect(list1[0]!.name).toBe("User 1's Project");

      // User 2 should only see their own project
      const { caller: caller2 } = await createAuthenticatedCaller(user2);
      const list2 = await caller2.project.list();

      expect(list2).toHaveLength(1);
      expect(list2[0]!.id).toBe(project2.id);
    });

    it("includes projects where user is a member (not just owner)", async () => {
      const owner = await createUser({ name: "Owner" });
      const member = await createUser({ name: "Member" });

      const project = await createProject({ name: "Shared Project", ownerId: owner.id });
      await createProjectMember({
        projectId: project.id,
        userId: member.id,
        role: "MEMBER",
      });

      const { caller } = await createAuthenticatedCaller(member);
      const list = await caller.project.list();

      expect(list).toHaveLength(1);
      expect(list[0]!.id).toBe(project.id);
    });
  });

  describe("project.getById", () => {
    it("returns project details with member count and task counts", async () => {
      // Use the factory to create a full scenario with members, tags, and tasks
      const scenario = await createProjectScenario({
        memberCount: 2,
        tagCount: 3,
        taskCount: 4,
      });

      // Authenticate as the scenario owner
      const { caller } = await createAuthenticatedCaller(scenario.owner);

      // Get the project details
      const result = await caller.project.getById({ id: scenario.project.id });

      // Verify structure
      expect(result.id).toBe(scenario.project.id);
      expect(result.name).toBe(scenario.project.name);
      expect(result.members).toHaveLength(3); // owner + 2 members
      expect(result.taskCounts).toBeDefined();
      expect(result.taskCounts.TODO).toBe(4); // all tasks are TODO by default
    });

    it("throws FORBIDDEN for non-members", async () => {
      // Create a project owned by someone else
      const owner = await createUser();
      const project = await createProject({ name: "Private Project", ownerId: owner.id });

      // Try to access as a different user who is not a member
      const intruder = await createUser();
      const { caller } = await createAuthenticatedCaller(intruder);

      await expect(caller.project.getById({ id: project.id })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("project.update", () => {
    it("updates project name and description in the database", async () => {
      const { user, caller } = await createAuthenticatedCaller();
      const project = await createProject({ name: "Old Name", ownerId: user.id });

      const result = await caller.project.update({
        id: project.id,
        name: "New Name",
        description: "New Description",
      });

      // Verify return value
      expect(result.name).toBe("New Name");
      expect(result.description).toBe("New Description");

      // Verify actual database update
      const dbProject = await testDb.project.findUnique({
        where: { id: project.id },
      });

      expect(dbProject!.name).toBe("New Name");
      expect(dbProject!.description).toBe("New Description");
    });

    it("allows ADMIN to update project", async () => {
      const owner = await createUser({ name: "Owner" });
      const admin = await createUser({ name: "Admin" });

      const project = await createProject({ name: "Original", ownerId: owner.id });
      await createProjectMember({
        projectId: project.id,
        userId: admin.id,
        role: "ADMIN",
      });

      const { caller } = await createAuthenticatedCaller(admin);
      const result = await caller.project.update({
        id: project.id,
        name: "Updated by Admin",
      });

      expect(result.name).toBe("Updated by Admin");
    });

    it("prevents MEMBER from updating project", async () => {
      const owner = await createUser();
      const member = await createUser();

      const project = await createProject({ name: "Original", ownerId: owner.id });
      await createProjectMember({
        projectId: project.id,
        userId: member.id,
        role: "MEMBER",
      });

      const { caller } = await createAuthenticatedCaller(member);

      await expect(
        caller.project.update({
          id: project.id,
          name: "Should Fail",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("project.delete", () => {
    it("deletes project and cascades to related data", async () => {
      // Create a full project scenario
      const scenario = await createProjectScenario({
        memberCount: 2,
        tagCount: 2,
        taskCount: 3,
      });

      // Authenticate as the scenario owner
      const { caller } = await createAuthenticatedCaller(scenario.owner);

      const projectId = scenario.project.id;

      // Verify all related data exists
      const tasksBefore = await testDb.task.count({ where: { projectId } });
      const tagsBefore = await testDb.tag.count({ where: { projectId } });
      const membersBefore = await testDb.projectMember.count({ where: { projectId } });

      expect(tasksBefore).toBe(3);
      expect(tagsBefore).toBe(2);
      expect(membersBefore).toBe(3); // owner + 2 members

      // Delete the project
      await caller.project.delete({ id: projectId });

      // Verify project is gone
      const deletedProject = await testDb.project.findUnique({
        where: { id: projectId },
      });
      expect(deletedProject).toBeNull();

      // Verify cascade deleted all related data
      const tasksAfter = await testDb.task.count({ where: { projectId } });
      const tagsAfter = await testDb.tag.count({ where: { projectId } });
      const membersAfter = await testDb.projectMember.count({ where: { projectId } });

      expect(tasksAfter).toBe(0);
      expect(tagsAfter).toBe(0);
      expect(membersAfter).toBe(0);
    });

    it("prevents ADMIN from deleting project (owner only)", async () => {
      const owner = await createUser();
      const admin = await createUser();

      const project = await createProject({ name: "Protected", ownerId: owner.id });
      await createProjectMember({
        projectId: project.id,
        userId: admin.id,
        role: "ADMIN",
      });

      const { caller } = await createAuthenticatedCaller(admin);

      await expect(caller.project.delete({ id: project.id })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      // Verify project still exists
      const dbProject = await testDb.project.findUnique({
        where: { id: project.id },
      });
      expect(dbProject).not.toBeNull();
    });
  });

  describe("project.addMember", () => {
    it("adds a new member to the project", async () => {
      const { user: owner, caller } = await createAuthenticatedCaller();
      const project = await createProject({ name: "Team Project", ownerId: owner.id });
      const newMember = await createUser({ email: "newbie@example.com" });

      const result = await caller.project.addMember({
        projectId: project.id,
        email: newMember.email!,
        role: "MEMBER",
      });

      expect(result.userId).toBe(newMember.id);
      expect(result.role).toBe("MEMBER");

      // Verify in database
      const membership = await testDb.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: newMember.id,
          },
        },
      });

      expect(membership).not.toBeNull();
      expect(membership!.role).toBe("MEMBER");
    });

    it("throws NOT_FOUND for non-existent email", async () => {
      const { user, caller } = await createAuthenticatedCaller();
      const project = await createProject({ name: "Team Project", ownerId: user.id });

      await expect(
        caller.project.addMember({
          projectId: project.id,
          email: "does-not-exist@example.com",
          role: "MEMBER",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("prevents adding duplicate members", async () => {
      const { user: owner, caller } = await createAuthenticatedCaller();
      const member = await createUser();
      const project = await createProject({ name: "Team Project", ownerId: owner.id });

      // Add member first time
      await caller.project.addMember({
        projectId: project.id,
        email: member.email!,
        role: "MEMBER",
      });

      // Try to add again - should fail
      await expect(
        caller.project.addMember({
          projectId: project.id,
          email: member.email!,
          role: "MEMBER",
        }),
      ).rejects.toBeDefined(); // Should throw some error
    });
  });
});
