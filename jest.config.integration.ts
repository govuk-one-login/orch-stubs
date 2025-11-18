import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  testMatch: ["<rootDir>/src/test/integration/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/test/integration/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "^jose": require.resolve("jose"),
  },
};

export default config;
