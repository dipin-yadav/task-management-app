import { type NextApiRequest, type NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { hashPassword } from "~/server/auth/password";
import { signupSchema } from "~/server/auth/signup";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Invalid registration details" });
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Create user
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: error.errors[0]?.message ?? "Validation error" });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ error: "Invalid registration details" });
    }

    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
