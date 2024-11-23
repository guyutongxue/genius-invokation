#!/usr/bin/env bun
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

/**
 * This file run all build scripts for building standalone target.
 */

import { $, color } from "bun";
import { parseArgs } from "node:util";

const { values: { prod } } = parseArgs({
  args: process.argv.slice(2),
  options: {
    prod: { type: "boolean" }
  }
})

const packages = [
  "static-data",
  "typings",
  "utils",
  "core",
  "data",
  "detail-log-viewer",
  "webui-core",
  "deck-builder",
  "web-client",
  "standalone",
  "cbinding",
];

for (const pkg of packages) {
  console.log(color("green", "ansi") + pkg + "\u001b[0m");
  if (prod) {
    await $`bun run build:prod`.cwd(`packages/${pkg}`);
  } else {
    await $`bun run build`.cwd(`packages/${pkg}`);
  }
}
