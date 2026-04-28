import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/main/**/*.ts"],
    coverage: {
      include: ["src/main/**/*.ts"],
      reporter: ["lcov", "text"],
    },
    globals: true,
    setupFiles: ["src/test/integration/setup.ts"],
  },
});
