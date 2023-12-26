import path from "node:path";
import { fileURLToPath } from "node:url";

export const BASE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);
