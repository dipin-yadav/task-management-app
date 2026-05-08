import { type User } from "@prisma/client";
import { type Session } from "next-auth";

import { createCaller } from "~/server/api/root";
import { testDb } from "./setup";

/**
 * Create a mock session for a user.
 */
export function createMockSession(user: User): Session {
  return {
    expires: new Date("2099-01-01T00:00:00.000Z").toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  };
}

/**
 * Create a tRPC caller authenticated as a specific user.
 * This caller will use the real test database.
 *
 * @example
 * const { caller, user } = await createAuthenticatedCaller();
 * const projects = await caller.project.list();
 */
export async function createAuthenticatedCaller(user?: User) {
  const testUser = user ?? (await createTestUser());
  const session = createMockSession(testUser);

  const ctx = {
    db: testDb,
    session,
  };

  const caller = createCaller(ctx);

  return {
    caller,
    user: testUser,
    session,
  };
}

/**
 * Create a test user with default values.
 * This is a helper - you can also use factories.ts for more control.
 */
async function createTestUser(): Promise<User> {
  const timestamp = Date.now();
  return testDb.user.create({
    data: {
      email: `test-${timestamp}@example.com`,
      name: "Test User",
    },
  });
}

/**
 * Create an unauthenticated tRPC caller.
 * Useful for testing procedures that should reject unauthenticated requests.
 *
 * @example
 * const { caller } = createUnauthenticatedCaller();
 * await expect(caller.project.list()).rejects.toThrow("UNAUTHORIZED");
 */
export function createUnauthenticatedCaller() {
  const ctx = {
    db: testDb,
    session: null,
  };

  const caller = createCaller(ctx);

  return {
    caller,
    ctx,
  };
}

/**
 * Type for the authenticated caller - useful for type annotations.
 */
export type AuthenticatedCaller = Awaited<ReturnType<typeof createAuthenticatedCaller>>["caller"];
