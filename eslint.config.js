import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "node_modules", ".kilo/worktrees", "vite.config.js", "vite.config.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/server/**/*.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["src/core/context/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/core/transition/ViewTransition.tsx"],
    rules: {
      // Este archivo exporta tanto el componente `ViewTransition` como hooks
      // (`useTransitionTheme`, `useViewTransition`) que son necesarios para
      // consumir la misma lógica desde otras pantallas. El plugin de fast
      // refresh no puede distinguirlos sin romper el patrón de hooks.
      "react-refresh/only-export-components": "off",
      // `views[current]?.(api)` renderiza una función de vista con un API object,
      // patrón estándar y seguro. El plugin react-hooks/refs (v7) genera falsos
      // positivos aquí porque interpreta `views` como un ref.
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        caches: "readonly",
        fetch: "readonly",
        self: "readonly",
        URL: "readonly",
        Response: "readonly",
        Request: "readonly",
      },
    },
  },
  prettier,
  {
    files: ["*.mjs", "vite.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        caches: "readonly",
        fetch: "readonly",
        self: "readonly",
        URL: "readonly",
        Response: "readonly",
        Request: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        navigator: "readonly",
        document: "readonly",
        location: "readonly",
        importScripts: "readonly",
        define: "readonly",
        Headers: "readonly",
        ExtendableEvent: "readonly",
        FetchEvent: "readonly",
        indexedDB: "readonly",
        IDBDatabase: "readonly",
        IDBObjectStore: "readonly",
        IDBIndex: "readonly",
        IDBCursor: "readonly",
        IDBTransaction: "readonly",
        IDBRequest: "readonly",
        DOMException: "readonly",
      },
    },
  },
);
