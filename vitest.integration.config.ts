import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/integration/**/*.test.ts"],
    coverage: {
      include: ["src/test/integration/**/*.test.ts"],
      reporter: ["lcov", "text"],
    },
    globals: true,
    globalSetup: ["src/test/integration/setup.ts"],
  },
});
