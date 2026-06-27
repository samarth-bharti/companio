import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Throwaway dev/diagnostic helpers — not shipped, not worth linting.
    "scripts/**",
  ]),
  {
    rules: {
      // React-19's set-state-in-effect fires on the legitimate "read
      // localStorage after mount" hydration pattern used across the UI.
      // Keep it visible as a warning rather than failing lint/CI.
      "react-hooks/set-state-in-effect": "warn",
      // Allow intentionally-unused names prefixed with "_" (e.g. stub params
      // on not-yet-wired functions, deliberately-ignored destructured fields).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
