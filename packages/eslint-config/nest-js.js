import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**", "uploads/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Nest constructor injection and decorated DTO parameters require runtime
      // imports even when TypeScript syntax only references them as annotations.
      // Keep type-only imports explicit during review instead of applying the
      // generic consistent-type-imports autofix across Nest-managed classes.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["src/modules/support/support-tickets.service.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },
);
