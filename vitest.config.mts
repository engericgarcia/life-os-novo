import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // A suíte cobre as funções puras (datas, recorrência e sequências), que
    // não tocam no banco nem no DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
