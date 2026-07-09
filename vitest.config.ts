import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next resuelve "server-only" vía su bundler; en test lo mapeamos a un
      // módulo vacío para poder importar código de servidor y testear su lógica pura.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
