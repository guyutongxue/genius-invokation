import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import babel from "@rollup/plugin-babel";

export default defineConfig({
  plugins: [
    solid(),
    babel({
      babelHelpers: "bundled",
    }),
  ],
});
