import { beforeEach, vi } from "vitest";

process.env.SKIP_ENV_VALIDATION = "true";

beforeEach(() => {
  vi.clearAllMocks();
});
