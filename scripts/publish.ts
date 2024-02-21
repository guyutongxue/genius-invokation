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
 * This file tries to publish all publish-able packages.
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { PackageJson } from "type-fest";

$.throws(true);

const packages = ["typings", "utils", "core", "data", "webui"];
const needBuild = ["typings", "core", "webui-core"];
const VERSION = "0.1.0";

const built: string[] = [];
for (const pkg of needBuild) {
  await $`bun run build`.cwd(`packages/${pkg}`);
  built.push(pkg);
}

interface PackageInfo {
  directory: string;
  packageJson: PackageJson;
}

const packageInfos: PackageInfo[] = [];
for (const pkg of packages) {
  const directory = `packages/${pkg}`;
  if (!existsSync(directory)) {
    throw new Error(`Package directory not found: ${directory}`);
  }
  const packageJson: PackageJson = await Bun.file(`${directory}/package.json`).json();
  if (!built.includes(pkg) && ("build" in (packageJson.scripts ?? {}))) {
    await $`bun run build`.cwd(directory);
  }
  if ("build:publish" in (packageJson.scripts ?? {})) {
    await $`bun run build:publish`.cwd(directory);
  }
  if ("exports:publish" in packageJson) {
    packageJson.exports = packageJson["exports:publish"] as any;
    delete packageJson["exports:publish"];
  }
  packageInfos.push({ directory, packageJson });
  if (!existsSync(`${directory}/dist`)) {
    throw new Error(`Package dist directory not found: ${directory}`);
  }
  if (!existsSync(`${directory}/README.md`)) {
    throw new Error(`Package README.md not found: ${directory}`);
  }
}

const publishDir = "temp";
const licensePath = "LICENSE";

for (const { packageJson, directory } of packageInfos) {
  const { name, version } = packageJson;
  if (!version?.startsWith(VERSION)) {
    throw new Error(`Version not starts with ${VERSION}: ${name}`);
  }
  await $`rm -rf ${publishDir}`;
  await $`mkdir -p ${publishDir}/dist`;
  await $`cp -r ${directory}/dist ${publishDir}/dist`;
  await $`echo ${JSON.stringify(packageJson, void 0, 2)} > ${publishDir}/package.json`;
  await $`cp ${directory}/README.md ${publishDir}/README.md`;
  await $`cp ${licensePath} ${publishDir}/LICENSE`;
  await $`bunx --bun attw --pack ${publishDir}`;
  await $`npm publish --access public --dry-run`.cwd(publishDir);

  throw "not implemented";
}
