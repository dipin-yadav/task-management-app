import { describe, expect, it } from "vitest";

import { signupSchema } from "~/server/auth/signup";

describe("signup validation", () => {
  it("rejects an invalid email address", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "Invalid email address",
      );
    }
  });

  it("rejects a password shorter than six characters", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "Password must be at least 6 characters",
      );
    }
  });

  it("accepts valid signup input", () => {
    const input = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    const result = signupSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });
});
