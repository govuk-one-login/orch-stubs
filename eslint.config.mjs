import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import jest from "eslint-plugin-jest"

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: { ...globals.node, ...globals.jest } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  jest.configs['flat/recommended'],
  { rules: { "@typescript-eslint/no-var-requires": "off", "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ] } },
  { ignores: ["*.d.ts", "node_modules", "dist", ".aws-sam", "build", "**/style.ts"] },
];
