#!/usr/bin/env bun
// @ts-check
import { $ } from "bun";

const folderNames = ["typings", "core", "webui-core", "standalone"]

for (const folder of folderNames) {
  await $`bun run build`.cwd(`packages/${folder}`);
}
