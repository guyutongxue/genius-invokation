import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import babel from "@rollup/plugin-babel";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";

export default defineConfig({
  esbuild: {
    target: "ES2020",
  },
  base: WEB_CLIENT_BASE_PATH,
  plugins: [
    solid(),
    babel({
      babelHelpers: "bundled",
    }),
  ],
});
