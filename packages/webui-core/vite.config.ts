import { resolve } from "node:path";
import { defineConfig } from "vite";
import unoCss from "unocss/vite";
import devtools from "solid-devtools/vite";
import solid from "vite-plugin-solid";
import { libInjectCss } from "vite-plugin-lib-inject-css";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    devtools({
      autoname: true,
      locator: {
        targetIDE: "vscode",
        key: "Ctrl",
        jsxLocation: true,
        componentLocation: true,
      },
    }),
    unoCss(),
    solid(),
    libInjectCss(),
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    minify: false,
    rollupOptions: {
      external: ["solid-js", /^solid-js\/.*/],
    },
  },
});
