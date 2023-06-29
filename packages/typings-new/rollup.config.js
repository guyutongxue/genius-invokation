// @ts-check
import typescript from "@rollup/plugin-typescript";
import nodeExternals from "rollup-plugin-node-externals";
import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: ["src/index.ts"],
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
    },
    plugins: [json(), typescript(), nodeExternals()],
  },
]);
