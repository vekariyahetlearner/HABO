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
    // Capacitor projects and their bundled WebView assets are generated output.
    // Lint source code, not copied/minified framework code.
    "android/**",
    "ios/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
