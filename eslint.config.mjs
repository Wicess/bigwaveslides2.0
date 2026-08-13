import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

// Flat config (ESLint 9). Avoids the FlatCompat + eslint-config-next
// circular-serialization bug by composing the official flat configs directly.
export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "*.config.*"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // A leading underscore marks something as deliberately unused. Needed for
      // parameters that must keep their position for callers' sake even though
      // the body no longer reads them — e.g. formatPrice/formatDate's `locale`,
      // vestigial since the site became English-only.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
