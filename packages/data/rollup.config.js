// @ts-check
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: ["src/index.ts"],
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript(),
    ],
  },
]);
