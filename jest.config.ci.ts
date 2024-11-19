import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/main/**/*.ts", "!**/node_modules/**"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/src/test/integration/setup.ts"],
};

export default config;
