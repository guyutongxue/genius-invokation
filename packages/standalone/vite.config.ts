import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

export default defineConfig({
  plugins: [
    solid(),
    getBabelOutputPlugin({
      presets: ["@babel/preset-env"],
      compact: true,
    }),
  ],
});
