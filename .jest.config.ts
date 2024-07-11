export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["**/*.test.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
};
