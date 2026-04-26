import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "~/utils/format";

describe("date formatting helpers", () => {
  it("formats valid dates", () => {
    expect(formatDate("2026-04-26T08:30:00.000Z")).toBe("Apr 26, 2026");
    expect(formatDateTime("2026-04-26T08:30:00.000Z")).toContain(
      "Apr 26, 2026",
    );
  });

  it("returns No date for empty or malformed values", () => {
    expect(formatDate(null)).toBe("No date");
    expect(formatDate("not-a-date")).toBe("No date");
    expect(formatDateTime(undefined)).toBe("No date");
    expect(formatDateTime("not-a-date")).toBe("No date");
  });
});
