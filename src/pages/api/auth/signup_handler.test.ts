/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from "vitest";
import { type NextApiRequest, type NextApiResponse } from "next";
import { type User } from "@prisma/client";
import handler from "~/pages/api/auth/signup";
import { db } from "~/server/db";

vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("~/server/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: null,
  image: null,
  password: "hashed-password",
  createdAt: new Date(),
  updatedAt: new Date(),
} as User;

describe("Signup API Security", () => {
  it("returns a generic error message for both new and existing users", async () => {
    // 1. Test existing user
    const req1 = {
      method: "POST",
      body: {
        name: "Test User",
        email: "existing@example.com",
        password: "password123456",
      },
    } as NextApiRequest;

    const res1 = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as NextApiResponse;

    const { findUnique, create } = db.user;
    const findUniqueMock = vi.mocked(findUnique);
    findUniqueMock.mockResolvedValueOnce(mockUser);

    await handler(req1, res1);

    expect(res1.status).toHaveBeenCalledWith(400);
    expect(res1.json).toHaveBeenCalledWith({ error: "Invalid registration details" });

    // 2. Test new user (to ensure it's different from the error case)
    const req2 = {
      method: "POST",
      body: {
        name: "New User",
        email: "new@example.com",
        password: "password123456",
      },
    } as NextApiRequest;

    const res2 = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as NextApiResponse;

    findUniqueMock.mockResolvedValueOnce(null);
    vi.mocked(create).mockResolvedValueOnce(mockUser);

    await handler(req2, res2);

    expect(res2.status).toHaveBeenCalledWith(201);
    expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({ message: "User created successfully" }));
  });
});
