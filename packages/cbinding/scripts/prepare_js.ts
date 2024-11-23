import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

const build = await rollup({
  input: `${import.meta.dirname}/../js/main.ts`,
  external: ["@gi-tcg/cbinding-io"],
  plugins: [
    typescript(),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    }),
    commonjs(),
    nodeResolve(),
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

const D_CHAR_SEQ = "#####EOF#####";

if (chunk.type !== "chunk") {
  throw new Error("Unexpected output type");
}
// await Bun.write("temp.js", chunk.code);
await Bun.write(
  `${import.meta.dirname}/../generated/js_code.cpp`,
  `
namespace gitcg {
  namespace v1_0 {
    extern const char JS_CODE[] = R"${D_CHAR_SEQ}(${chunk.code})${D_CHAR_SEQ}";
  }
}`,
);
