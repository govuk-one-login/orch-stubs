import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import vitestEslint from "@vitest/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default defineConfig(
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    plugins: {
      vitest: vitestEslint,
    },
    files: ["src/**/*.test.ts"],
    rules: {
      ...vitestEslint.configs.all.rules,
      "vitest/prefer-importing-vitest-globals": "off",
      "vitest/no-hooks": "off",
      "vitest/prefer-expect-assertions": "off",
      "vitest/prefer-import-in-mock": "off",
      "vitest/require-mock-type-parameters": "off",
      "vitest/require-to-throw-message": "off",
      "vitest/prefer-lowercase-title": "off",
    },
  },
  {
    ignores: [
      "tsconfig.json",
      "eslint.config.ts",
      "vitest.config.ts",
      "jest.ci.config.ts",
      "jest.integration.config.ts",
      "*.d.ts",
      "node_modules",
      "dist",
      ".aws-sam",
      "build",
      "**/style.ts",
      "*.json",
    ],
  }
);
