import { Prisma } from "@prisma/client";
import { type NextApiRequest, type NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("~/server/db", () => ({ db: dbMock }));
vi.mock("~/server/auth/password", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
}));

import handler from "~/pages/api/auth/signup";

function createResponse() {
  const res = {} as NextApiResponse;

  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);

  return res;
}

describe("signup API", () => {
  beforeEach(() => {
    dbMock.user.create.mockReset();
    dbMock.user.findUnique.mockReset();
  });

  it("returns 409 when a concurrent signup hits the email unique constraint", async () => {
    const req = {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password1234",
      },
    } as NextApiRequest;
    const res = createResponse();

    dbMock.user.findUnique.mockResolvedValue(null);
    dbMock.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.22.0",
      }),
    );

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid registration details",
    });
  });

  it("returns 400 when the user already exists (pre-check)", async () => {
    const req = {
      method: "POST",
      body: {
        name: "Test User",
        email: "existing@example.com",
        password: "password1234",
      },
    } as NextApiRequest;
    const res = createResponse();

    dbMock.user.findUnique.mockResolvedValue({
      id: "1",
      email: "existing@example.com",
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid registration details",
    });
  });
});
