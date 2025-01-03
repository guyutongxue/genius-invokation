// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import solid from "vite-plugin-solid";

export default defineConfig({
  esbuild: {
    target: "ES2022",
  },
  resolve: {
    conditions: ["bun"],
  },
  plugins: [
    solid(),
    !process.env.NO_TYPING &&
      dts({
        rollupTypes: true,
        bundledPackages: ["@gi-tcg/webui-core"],
      }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "style",
    },
  },
});
