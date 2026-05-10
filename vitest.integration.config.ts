import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(rootDir, "src"),
    },
  },
  test: {
    clearMocks: true,
    environment: "node", // Use node environment for integration tests (no jsdom needed)
    globals: true,
    include: ["src/**/*.integration.test.ts", "src/**/*.integration.test.tsx"],
    exclude: ["node_modules"],
    restoreMocks: true,
    // No setupFiles - each test file handles its own setup
    // to ensure proper database lifecycle management
    fileParallelism: false, // Run tests sequentially to avoid database conflicts
    hookTimeout: 30000, // Allow time for database operations
    testTimeout: 30000,
  },
});
