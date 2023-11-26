import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import unoCss from "unocss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: null
  },
  plugins: [vue(), unoCss()],
});
