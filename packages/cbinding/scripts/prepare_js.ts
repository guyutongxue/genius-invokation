import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { rollup } from "rollup";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

const build = await rollup({
  input: `${import.meta.dirname}/../js/main.ts`,
  external: ["@gi-tcg/cbinding-io"],
  plugins: [
    babel({
      extensions: [".mjs", ".js", ".ts"],
      presets: ["@babel/preset-typescript"],
      babelHelpers: "bundled",
    }),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    }),
    commonjs(),
    nodeResolve({
      extensions: [".mjs", ".js", ".ts"],
    }),
    terser(),
  ],
  onwarn: (warn, handler) => {
    if (warn.code === "THIS_IS_UNDEFINED") {
      return;
    }
    handler(warn);
  },
  context: void 0,
});

const {
  output: [chunk],
} = await build.generate({
  format: "es",
});

const OUTPUT_FILEPATH = `${import.meta.dirname}/../generated/js_code.cpp`;

const D_CHAR_SEQ = "#####EOF#####";

if (chunk.type !== "chunk") {
  throw new Error("Unexpected output type");
}

await mkdir(dirname(OUTPUT_FILEPATH), { recursive: true });
// await Bun.write("temp.js", chunk.code);
await Bun.write(
  OUTPUT_FILEPATH,
  `namespace gitcg {
  namespace v1_0 {
    extern const char JS_CODE[] = R"${D_CHAR_SEQ}(${chunk.code})${D_CHAR_SEQ}";
  }
}`,
);
