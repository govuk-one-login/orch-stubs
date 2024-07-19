import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["**/*.test.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
};

export default config;
