import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import babel from "@rollup/plugin-babel";

export default defineConfig({
  base: "gi-tcg",
  plugins: [
    solid(),
    babel({
      babelHelpers: "bundled",
    }),
  ],
});
