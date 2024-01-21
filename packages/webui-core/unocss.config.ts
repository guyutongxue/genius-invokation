import { defineConfig, presetUno } from "unocss";
import { parseColor, colorToString } from "@unocss/preset-mini/utils";

export default defineConfig({
  presets: [presetUno()],
  rules: [
    [
      /^btn-(.*)$/,
      ([, c], { theme }) => {
        const data = parseColor(c, theme, "colors");

        if (data?.cssColor) {
          return {
            "--btn-color": colorToString(data.cssColor),
          };
        }
      },
    ],
  ],
});
