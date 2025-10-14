import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/src/test/integration/"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
};

export default config;
