import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Prisma schema relation policies", () => {
  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );

  it("keeps task user delete behavior explicit", () => {
    expect(schema).toContain(
      'creator     User         @relation("TaskCreator", fields: [creatorId], references: [id], onDelete: Restrict)',
    );
    expect(schema).toContain(
      'assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)',
    );
  });
});
