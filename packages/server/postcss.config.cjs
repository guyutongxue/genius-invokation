/** @type {import("postcss-load-config").Config} */
module.exports = {
  plugins: [
    require("postcss-preset-env"),
    require("@unocss/postcss"),
  ]
};
