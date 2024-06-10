// @ts-check

/** @type {import('pm2').StartOptions} */
export default {
  name: "@gi-tcg/server",
  script: "src/main.ts",
  interpreter: "bun"
}
