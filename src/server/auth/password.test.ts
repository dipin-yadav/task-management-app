import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "~/server/auth/password";

describe("password helpers", () => {
  it("produces a valid bcrypt hash", async () => {
    const password = "correct-horse-battery-staple";

    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
  });

  it("compares the correct password successfully", async () => {
    const password = "valid-password";
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("valid-password");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
