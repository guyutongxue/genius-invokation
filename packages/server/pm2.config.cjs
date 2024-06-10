// @ts-check

/** @type {import('pm2').StartOptions} */
module.exports = {
  name: "@gi-tcg/server",
  script: "src/main.ts",
  interpreter: "bun"
}
