// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "file:///home/guyutongxue/Documents/repos/genius-invokation/packages/webui-core/node_modules/vite/dist/node/index.js";
import solid from "file:///home/guyutongxue/Documents/repos/genius-invokation/node_modules/vite-plugin-solid/dist/esm/index.mjs";
import nodeExternals from "file:///home/guyutongxue/Documents/repos/genius-invokation/node_modules/rollup-plugin-node-externals/dist/index.js";
import dts from "file:///home/guyutongxue/Documents/repos/genius-invokation/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/home/guyutongxue/Documents/repos/genius-invokation/packages/webui-core";
var vite_config_default = defineConfig({
  esbuild: {
    target: "ES2022"
  },
  resolve: {
    conditions: ["bun"]
  },
  plugins: [
    {
      ...nodeExternals(),
      enforce: "pre"
    },
    // devtools({
    //   autoname: true,
    //   locator: {
    //     targetIDE: "vscode",
    //     key: "Ctrl",
    //     jsxLocation: true,
    //     componentLocation: true,
    //   },
    // }),
    solid(),
    dts({
      bundledPackages: [
        "@gi-tcg/core",
        "@gi-tcg/typings"
      ],
      rollupTypes: true
    })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ndXl1dG9uZ3h1ZS9Eb2N1bWVudHMvcmVwb3MvZ2VuaXVzLWludm9rYXRpb24vcGFja2FnZXMvd2VidWktY29yZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvZ3V5dXRvbmd4dWUvRG9jdW1lbnRzL3JlcG9zL2dlbml1cy1pbnZva2F0aW9uL3BhY2thZ2VzL3dlYnVpLWNvcmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvZ3V5dXRvbmd4dWUvRG9jdW1lbnRzL3JlcG9zL2dlbml1cy1pbnZva2F0aW9uL3BhY2thZ2VzL3dlYnVpLWNvcmUvdml0ZS5jb25maWcudHNcIjsvLyBDb3B5cmlnaHQgKEMpIDIwMjQgR3V5dXRvbmd4dWVcbi8vIFxuLy8gVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbi8vIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzXG4vLyBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGVcbi8vIExpY2Vuc2UsIG9yIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4vLyBcbi8vIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuLy8gYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbi8vIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbi8vIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuLy8gXG4vLyBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2Vcbi8vIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBkZXZ0b29scyBmcm9tIFwic29saWQtZGV2dG9vbHMvdml0ZVwiO1xuaW1wb3J0IHNvbGlkIGZyb20gXCJ2aXRlLXBsdWdpbi1zb2xpZFwiO1xuaW1wb3J0IG5vZGVFeHRlcm5hbHMgZnJvbSBcInJvbGx1cC1wbHVnaW4tbm9kZS1leHRlcm5hbHNcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlc2J1aWxkOiB7XG4gICAgdGFyZ2V0OiBcIkVTMjAyMlwiXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBjb25kaXRpb25zOiBbXCJidW5cIl1cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHtcbiAgICAgIC4uLm5vZGVFeHRlcm5hbHMoKSxcbiAgICAgIGVuZm9yY2U6IFwicHJlXCIsXG4gICAgfSxcbiAgICAvLyBkZXZ0b29scyh7XG4gICAgLy8gICBhdXRvbmFtZTogdHJ1ZSxcbiAgICAvLyAgIGxvY2F0b3I6IHtcbiAgICAvLyAgICAgdGFyZ2V0SURFOiBcInZzY29kZVwiLFxuICAgIC8vICAgICBrZXk6IFwiQ3RybFwiLFxuICAgIC8vICAgICBqc3hMb2NhdGlvbjogdHJ1ZSxcbiAgICAvLyAgICAgY29tcG9uZW50TG9jYXRpb246IHRydWUsXG4gICAgLy8gICB9LFxuICAgIC8vIH0pLFxuICAgIHNvbGlkKCksXG4gICAgZHRzKHtcbiAgICAgIGJ1bmRsZWRQYWNrYWdlczogW1xuICAgICAgICBcIkBnaS10Y2cvY29yZVwiLFxuICAgICAgICBcIkBnaS10Y2cvdHlwaW5nc1wiLFxuICAgICAgXSxcbiAgICAgIHJvbGx1cFR5cGVzOiB0cnVlXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9pbmRleC50c1wiKSxcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgICAgZmlsZU5hbWU6IFwiaW5kZXhcIixcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBZUEsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsb0JBQW9CO0FBRTdCLE9BQU8sV0FBVztBQUNsQixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLFNBQVM7QUFwQmhCLElBQU0sbUNBQW1DO0FBc0J6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsWUFBWSxDQUFDLEtBQUs7QUFBQSxFQUNwQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1A7QUFBQSxNQUNFLEdBQUcsY0FBYztBQUFBLE1BQ2pCLFNBQVM7QUFBQSxJQUNYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxNQUFNO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixpQkFBaUI7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3hDLFNBQVMsQ0FBQyxJQUFJO0FBQUEsTUFDZCxVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
