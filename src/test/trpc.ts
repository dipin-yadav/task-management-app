import { type PrismaClient } from "@prisma/client";
import { type Session } from "next-auth";
import { vi } from "vitest";

import { createCaller } from "~/server/api/root";

type MockFn = ReturnType<typeof vi.fn>;

export const TEST_USER_ID = "clx00000000000000000000001";
export const TEST_PROJECT_ID = "clx00000000000000000000002";
export const TEST_TASK_ID = "clx00000000000000000000003";
export const TEST_MEMBER_ID = "clx00000000000000000000004";
export const TEST_TAG_ID = "clx00000000000000000000005";
export const TEST_OTHER_TAG_ID = "clx00000000000000000000006";
export const TEST_OTHER_USER_ID = "clx00000000000000000000007";

export const createMockSession = (userId = TEST_USER_ID): Session => ({
  expires: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  user: {
    id: userId,
    name: "Test User",
    email: "test@example.com",
    image: null,
  },
});

export interface MockDb {
  project: {
    create: MockFn;
    delete: MockFn;
    findMany: MockFn;
    findUnique: MockFn;
    update: MockFn;
  };
  projectMember: {
    create: MockFn;
    delete: MockFn;
    findUnique: MockFn;
    findFirst: MockFn;
    update: MockFn;
  };
  activity: {
    create: MockFn;
  };
  user: {
    findUnique: MockFn;
  };
  tag: {
    count: MockFn;
    create: MockFn;
    delete: MockFn;
    findMany: MockFn;
    findUnique: MockFn;
    update: MockFn;
  };
  task: {
    create: MockFn;
    delete: MockFn;
    findMany: MockFn;
    findUnique: MockFn;
    groupBy: MockFn;
    update: MockFn;
  };
  taskTag: {
    create: MockFn;
    createMany: MockFn;
    delete: MockFn;
    deleteMany: MockFn;
    findUnique: MockFn;
  };
  $transaction: MockFn;
}

export const createMockDb = (): MockDb => {
  const db: MockDb = {
    project: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    projectMember: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    tag: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    task: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
    },
    taskTag: {
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const runTransaction = (callback: (tx: MockDb) => unknown) => callback(db);
  db.$transaction.mockImplementation(runTransaction);

  // Alias findFirst to findUnique so existing test mocks work seamlessly
  db.projectMember.findFirst.mockImplementation((args) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return (db.projectMember.findUnique as (...args: unknown[]) => unknown)(args);
  });

  return db;
};

export const createMockCaller = (db: MockDb, userId = TEST_USER_ID) => {
  return createCaller({
    db: db as unknown as PrismaClient,
    session: createMockSession(userId),
  });
};
