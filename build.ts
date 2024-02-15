#!/usr/bin/env bun
import { $ } from "bun";

const folderNames = ["typings", "core", "webui-core", "standalone"]

for (const folder of folderNames) {
  await $`bun run build`.cwd(`packages/${folder}`);
}
