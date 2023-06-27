// @ts-check
import typescript from "@rollup/plugin-typescript";
// import nodeResolve from "@rollup/plugin-node-resolve";
// import commonJs from "@rollup/plugin-commonjs";
// import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: ["src/index.ts"],
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
    },
  external: [/node_modules/, /^@gi-tcg\/.*/],
    plugins: [typescript()],
  },
]);
