import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import babel from "@rollup/plugin-babel";
import { BASE } from "./src/config";

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  resolve: {
    conditions: ["bun"],
  },
  plugins: [
    solid({ ssr: true }),
    babel({
      babelHelpers: "bundled",
    }),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  ssr: {
    optimizeDeps: {
      include: ["core-js", "axios"]
    }
  }
  // optimizeDeps: {
  //   include: ['core-js']
  // },
});
