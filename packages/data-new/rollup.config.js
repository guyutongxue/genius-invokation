// @ts-check
import typescript from "@rollup/plugin-typescript";
import nodeExternals from "rollup-plugin-node-externals";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: ["src/index.ts"],
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
    },
    plugins: [typescript(), nodeExternals()],
  },
]);
