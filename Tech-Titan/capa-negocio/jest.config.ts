import type { Config } from "jest";

const config: Config = {
  preset:              "ts-jest",
  testEnvironment:     "node",
  rootDir:             "./src",
  testMatch:           ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@backend/(.*)$":  "<rootDir>/$1",
    "^@types/(.*)$":    "<rootDir>/types/$1",
    "^@services/(.*)$": "<rootDir>/services/$1",
    "^@lib/(.*)$":      "<rootDir>/lib/$1",
  },
  collectCoverageFrom: [
    "services/**/*.ts",
    "api/**/*.ts",
    "!**/__tests__/**",
  ],
};

export default config;
