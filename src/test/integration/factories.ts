import { hashPassword } from "~/server/auth/password";
import { testDb } from "./setup";
import { type ProjectRole, type TaskPriority, type TaskStatus } from "@prisma/client";

let counter = 0;

function generateUniqueEmail(): string {
  counter++;
  return `test-user-${counter}-${Date.now()}@example.com`;
}

function generateUniqueName(prefix: string): string {
  counter++;
  return `${prefix} ${counter}`;
}

interface CreateUserOptions {
  email?: string;
  name?: string;
  password?: string;
  image?: string;
}

export async function createUser(options: CreateUserOptions = {}) {
  const email = options.email ?? generateUniqueEmail();
  const name = options.name ?? generateUniqueName("Test User");
  const password = options.password ? await hashPassword(options.password) : null;

  return testDb.user.create({
    data: {
      email,
      name,
      password,
      image: options.image,
    },
  });
}

interface CreateProjectOptions {
  name?: string;
  description?: string;
  ownerId: string;
}

export async function createProject(options: CreateProjectOptions) {
  const name = options.name ?? generateUniqueName("Test Project");

  return testDb.project.create({
    data: {
      name,
      description: options.description,
      ownerId: options.ownerId,
      members: {
        create: {
          userId: options.ownerId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      owner: true,
    },
  });
}

interface CreateProjectMemberOptions {
  projectId: string;
  userId: string;
  role?: ProjectRole;
}

export async function createProjectMember(options: CreateProjectMemberOptions) {
  return testDb.projectMember.create({
    data: {
      projectId: options.projectId,
      userId: options.userId,
      role: options.role ?? "MEMBER",
    },
    include: {
      user: true,
      project: true,
    },
  });
}

interface CreateTagOptions {
  name?: string;
  color?: string;
  projectId: string;
}

export async function createTag(options: CreateTagOptions) {
  const name = options.name ?? generateUniqueName("Tag");

  return testDb.tag.create({
    data: {
      name,
      color: options.color ?? "#6366f1",
      projectId: options.projectId,
    },
  });
}

interface CreateTaskOptions {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: Date;
  projectId: string;
  creatorId: string;
  assigneeId?: string | null;
  tagIds?: string[];
}

export async function createTask(options: CreateTaskOptions) {
  const title = options.title ?? generateUniqueName("Test Task");

  const data: Parameters<typeof testDb.task.create>[0]["data"] = {
    title,
    description: options.description,
    status: options.status ?? "TODO",
    priority: options.priority ?? "MEDIUM",
    deadline: options.deadline,
    projectId: options.projectId,
    creatorId: options.creatorId,
    assigneeId: options.assigneeId,
  };

  // Handle tags if provided
  if (options.tagIds && options.tagIds.length > 0) {
    data.tags = {
      create: options.tagIds.map((tagId) => ({
        tag: {
          connect: { id: tagId },
        },
      })),
    };
  }

  return testDb.task.create({
    data,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      assignee: true,
      creator: true,
      project: true,
    },
  });
}

/**
 * Create a complete project scenario with:
 * - Owner user
 * - Project owned by that user
 * - Optional additional members
 * - Optional tags
 * - Optional tasks
 */
interface CreateProjectScenarioOptions {
  memberCount?: number;
  tagCount?: number;
  taskCount?: number;
}

export async function createProjectScenario(options: CreateProjectScenarioOptions = {}) {
  const owner = await createUser({ name: "Project Owner" });
  const project = await createProject({
    name: "Test Project",
    ownerId: owner.id,
  });

  const members = [];
  const tags = [];
  const tasks = [];

  // Create additional members
  if (options.memberCount) {
    for (let i = 0; i < options.memberCount; i++) {
      const user = await createUser({ name: `Member ${i + 1}` });
      const member = await createProjectMember({
        projectId: project.id,
        userId: user.id,
        role: "MEMBER",
      });
      members.push({ user, member });
    }
  }

  // Create tags
  if (options.tagCount) {
    for (let i = 0; i < options.tagCount; i++) {
      const tag = await createTag({
        name: `Tag ${i + 1}`,
        projectId: project.id,
      });
      tags.push(tag);
    }
  }

  // Create tasks
  if (options.taskCount) {
    for (let i = 0; i < options.taskCount; i++) {
      const task = await createTask({
        title: `Task ${i + 1}`,
        projectId: project.id,
        creatorId: owner.id,
        tagIds: i < tags.length ? [tags[i]!.id] : undefined,
        assigneeId: members.length > 0 ? members[i % members.length]!.user.id : undefined,
      });
      tasks.push(task);
    }
  }

  return {
    owner,
    project,
    members,
    tags,
    tasks,
  };
}
