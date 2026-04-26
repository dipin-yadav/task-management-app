import { type PrismaClient } from "@prisma/client";
import { type Session } from "next-auth";
import { vi } from "vitest";

import { createCaller } from "~/server/api/root";

type MockFn = ReturnType<typeof vi.fn>;

export const TEST_USER_ID = "clx00000000000000000000001";
export const TEST_PROJECT_ID = "clx00000000000000000000002";
export const TEST_TASK_ID = "clx00000000000000000000003";
export const TEST_MEMBER_ID = "clx00000000000000000000004";

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
    createMany: MockFn;
    deleteMany: MockFn;
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
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const runTransaction = (callback: (tx: MockDb) => unknown) => callback(db);
  db.$transaction.mockImplementation(runTransaction);

  return db;
};

export const createMockCaller = (db: MockDb, userId = TEST_USER_ID) => {
  return createCaller({
    db: db as unknown as PrismaClient,
    session: createMockSession(userId),
  });
};
