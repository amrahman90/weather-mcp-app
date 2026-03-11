export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^(\\.{1,2}/.*)\\.tsx$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
  collectCoverageFrom: ["**/*.ts", "**/*.tsx", "!**/*.d.ts", "!**/node_modules/**", "!main.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
