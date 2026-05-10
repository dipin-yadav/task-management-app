import { PrismaClient } from "@prisma/client";

// Create a separate Prisma client for integration tests
// This uses the DATABASE_URL from .env.test
const createTestPrismaClient = () =>
  new PrismaClient({
    log: process.env.DEBUG_TESTS === "true" ? ["query", "error", "warn"] : ["error"],
  });

const globalForTestPrisma = globalThis as unknown as {
  testPrisma: ReturnType<typeof createTestPrismaClient> | undefined;
};

export const testDb = globalForTestPrisma.testPrisma ?? createTestPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForTestPrisma.testPrisma = testDb;
}

/**
 * Clean up all test data between test runs.
 * Deletes in order to respect foreign key constraints.
 */
export async function cleanupDatabase(): Promise<void> {
  // Delete in reverse order of dependencies to avoid FK constraint errors
  await testDb.activity.deleteMany();
  await testDb.taskTag.deleteMany();
  await testDb.task.deleteMany();
  await testDb.tag.deleteMany();
  await testDb.projectMember.deleteMany();
  await testDb.project.deleteMany();
  await testDb.session.deleteMany();
  await testDb.account.deleteMany();
  await testDb.verificationToken.deleteMany();
  // Clean up users to prevent email conflicts between tests
  await testDb.user.deleteMany();
}

/**
 * Reset the database by cleaning up data.
 * Call this before or after each test/test file.
 */
export async function resetDatabase(): Promise<void> {
  await cleanupDatabase();
}

/**
 * Disconnect the test database client.
 * Call this after all tests complete.
 */
export async function disconnectDatabase(): Promise<void> {
  await testDb.$disconnect();
}
