import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "electron-reference/**"],
  },
});
