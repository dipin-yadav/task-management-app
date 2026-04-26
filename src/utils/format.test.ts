import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  initialsFor,
  getErrorMessage,
} from "~/utils/format";

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

describe("initialsFor", () => {
  it("generates initials from name", () => {
    expect(initialsFor("John Doe")).toBe("JD");
    expect(initialsFor("Jane")).toBe("J");
    expect(initialsFor("alice bob charlie")).toBe("AB");
  });

  it("falls back to email if name is missing", () => {
    expect(initialsFor(null, "test@example.com")).toBe("T");
    expect(initialsFor("", "user@example.com")).toBe("U");
  });

  it("returns ? if both name and email are missing", () => {
    expect(initialsFor(null, null)).toBe("?");
    expect(initialsFor("", "")).toBe("?");
    expect(initialsFor(undefined)).toBe("?");
  });
});

describe("getErrorMessage", () => {
  it("extracts message from Error object", () => {
    const error = new Error("Custom error message");
    expect(getErrorMessage(error)).toBe("Custom error message");
  });

  it("returns fallback for unknown error types", () => {
    expect(getErrorMessage("just a string")).toBe("Something went wrong");
    expect(getErrorMessage(null)).toBe("Something went wrong");
    expect(getErrorMessage({ message: "not an error instance" })).toBe(
      "Something went wrong",
    );
  });

  it("allows custom fallback", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });
});
