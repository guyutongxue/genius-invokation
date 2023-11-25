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
  strictNullChecks: true,
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
