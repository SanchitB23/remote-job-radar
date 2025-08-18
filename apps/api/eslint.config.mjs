import typescriptEslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintComments from "eslint-plugin-eslint-comments";
import boundaries from "eslint-plugin-boundaries";
import typescriptParser from "@typescript-eslint/parser";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}", "*.js", "*.jsx", "*.ts", "*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      import: importPlugin,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      "eslint-comments": eslintComments,
      boundaries: boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "components", pattern: "components/**" },
        { type: "lib", pattern: "lib/**" },
        { type: "app", pattern: "app/**" },
      ],
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
      "import/no-default-export": "error",
      "import/no-extraneous-dependencies": "off", // Disabled for monorepo
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "eslint-comments/no-unused-disable": "error",
      // Disable React rules for API server
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      // Boundaries
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: ["components"], allow: ["components", "lib"] },
            { from: ["lib"], allow: ["lib"] },
          ],
        },
      ],
    },
  },
];
