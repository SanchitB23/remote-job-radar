import typescriptEslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintComments from "eslint-plugin-eslint-comments";
import boundaries from "eslint-plugin-boundaries";
import typescriptParser from "@typescript-eslint/parser";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "build/**", "**/.next/**", "components/**"],
  },
  // Extend Next.js ESLint config
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,jsx,ts,tsx}", "*.js", "*.jsx", "*.ts", "*.tsx"],
    languageOptions: {
      parser: typescriptParser,
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
      // Disable rule that expects a /pages directory (for Next.js app dir)
      "@next/next/no-html-link-for-pages": "off",
      // Typescript strictness - make warnings instead of errors
      "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn", // Changed to warn
      "@typescript-eslint/no-unused-vars": "off", // use unused-imports instead
      // Unused imports/vars cleaner
      "unused-imports/no-unused-imports": "warn", // Changed to warn
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
      // Import hygiene - make less strict
      "import/no-default-export": "warn", // Changed to warn
      "import/no-extraneous-dependencies": "off", // Disabled for now
      "import/order": "off",
      "simple-import-sort/imports": "warn", // Changed to warn
      "simple-import-sort/exports": "warn", // Changed to warn
      // Comments hygiene
      "eslint-comments/no-unused-disable": "warn", // Changed to warn
      // Boundaries - disable for now
      "boundaries/element-types": "off",
    },
  },
  // Allow default exports in Next.js pages/routes where needed
  {
    files: [
      "**/app/**/page.tsx",
      "**/app/**/layout.tsx",
      "**/app/**/route.ts",
      "**/app/**/loading.tsx",
      "**/app/**/error.tsx",
      "**/pages/**/*",
      "**/middleware.ts",
      "**/next.config.ts",
      "**/app/**/not-found.tsx", // Allow default export in not-found.tsx
      "**/components/ui/**/*.tsx", // Allow default exports in ui components
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
];

export default config;
