import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

// Flat config (ESLint 9). Avoids the FlatCompat + eslint-config-next
// circular-serialization bug by composing the official flat configs directly.
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "*.config.*",
    ],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
);
