import { readFileSync } from "node:fs";
import { isSafeNumber, parse } from "lossless-json";

export function customNumberParser(value: string) {
  return isSafeNumber(value) ? parseFloat(value) : BigInt(value);
}

const cache: Record<string, any> = {};
export function readJson(path: string) {
  return (
    cache[path] ??
    (cache[path] = parse(
      readFileSync(path, "utf8"),
      void 0,
      customNumberParser,
    ))
  );
}
