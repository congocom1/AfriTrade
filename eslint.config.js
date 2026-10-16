import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".dart_tool/**",
      "debug-*.js",
      "debug-*.mjs",
      "test-*.js",
      "test-*.mjs",
      "**/*.testmod.mjs",
      "1",
      "claude-desktop_*.deb",
    ],
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: [
      "base44/**/*.js",
      "base44/**/*.mjs",
      "test/**/*.js",
      "test/**/*.mjs",
      "scripts/**/*.js",
      "scripts/**/*.mjs",
      "*.mjs",
      "*.js",
      "vite.config.js",
      "tailwind.config.js",
      "playwright.config.js",
    ],
    ignores: ["dist/**"],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: [
      "src/lib/**/*.{js,jsx}",
      "src/api/**/*.{js,jsx}",
      "src/hooks/**/*.{js,jsx}",
      "src/utils/**/*.{js,jsx}",
      "src/i18n/**/*.{js,jsx}",
      "src/components/ui/**/*.{js,jsx}",
      "src/lib/searchUtils.js",
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [
      "src/**/*.{js,mjs,cjs,jsx}",
      "lib/searchUtils.js",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*", "src/lib/searchUtils.js", "src/i18n/**/*"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "off",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
