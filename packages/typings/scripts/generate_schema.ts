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

import { fileURLToPath } from "node:url";
import * as path from "node:path";
import * as TJS from "typescript-json-schema";
import { glob } from "glob";
import { writeFile } from "node:fs/promises";
import { pascalCase } from "case-anything";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const basePath = path.join(dirname, "../src/api");
const apiTypingFiles = await glob(path.join(basePath, "*.ts"), {
  windowsPathsNoEscape: true,
});

const program = TJS.getProgramFromFiles(apiTypingFiles, {
  strict: true,
  skipLibCheck: true,
});

const generator = TJS.buildGenerator(program, {
  noExtraProps: true,
  required: true,
});

const notifySchema = generator?.getSchemaForSymbol("NotificationMessage");
await writeFile(
  path.join(basePath, "notification.json"),
  JSON.stringify(notifySchema),
);

const rpcMethods = ["rerollDice", "switchHands", "chooseActive", "action"];
const rpcSchemas: Record<string, { request: any; response: any }> = {};
for (const m of rpcMethods) {
  const reqType = pascalCase(m + "Request");
  const resType = pascalCase(m + "Response");
  rpcSchemas[m] = {
    request: generator?.getSchemaForSymbol(reqType),
    response: generator?.getSchemaForSymbol(resType),
  };
}
await writeFile(path.join(basePath, "rpc.json"), JSON.stringify(rpcSchemas));
