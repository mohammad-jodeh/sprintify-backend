import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc"; // Add JSDoc plugin

// Resolve tsconfig path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsconfigPath = path.join(__dirname, "tsconfig.json");

export default defineConfig([
  // Base JS config
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: ["**/dist/**", "**/node_modules/**"],
    plugins: { js },
    extends: ["js/recommended"],
  },

  // TypeScript + Node config (applied only to src/)
  {
    files: ["src/**/*.{ts,js}"], // Apply rules to files in src/
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      jsdoc, // Add the JSDoc plugin here
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      // Rule to enforce const when variable is not reassigned
      "prefer-const": [
        "error",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: false,
        },
      ],

      // Rule to prevent unused variables
      "no-unused-vars": [
        "error",
        {
          args: "none", // Don't require unused function arguments to be checked
          vars: "all", // Check all declared variables
          ignoreRestSiblings: false, // Don't ignore variables in destructuring
        },
      ],

      // Require JSDoc comments on functions and define return types
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
        },
      ],

      // Ensure functions have return types
      "@typescript-eslint/explicit-module-boundary-types": "error",

      // Disallow usage of `any` as a type
      "@typescript-eslint/no-explicit-any": "error",

      // Disallow the use of `var`
      "no-var": "error",
    },
  },
]);
