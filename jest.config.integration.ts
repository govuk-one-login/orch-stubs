import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  testMatch: ["<rootDir>/src/test/integration/**/*.test.ts"],
  globalSetup: "<rootDir>/src/test/integration/setup.ts",
};

export default config;
