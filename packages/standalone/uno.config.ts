import { defineConfig } from "unocss";
import { parseColor, colorToString } from "@unocss/preset-mini/utils";
import presetUno from "@unocss/preset-uno";

export default defineConfig({
  presets: [presetUno()],
  rules: [
    [/^btn-(.*)$/, ([, c], { theme }) => {
      const data = parseColor(c, theme, "colors");

      if (data) {
        return {
          "--btn-color": colorToString(data.cssColor),
        };
      }
    }]
  ]
});
