import path from "node:path";
import { Glob } from "bun";

const srcDir = path.join(import.meta.dirname, "../src");
const glob = new Glob("**/*.ts");

let todos = 0;
let total = 0;
for await (const filepath of glob.scan(srcDir)) {
  const text = await Bun.file(path.join(srcDir, filepath)).text();
  const todoMatches = text.match(/\/\/\s*TODO/g);
  if (todoMatches) {
    todos += todoMatches.length;
  }
  const totalMatches = text.match(/\.done\(\)/g);
  if (totalMatches) {
    total += totalMatches.length;
  }
}

console.log(`TODOs: ${todos}`);
console.log(`Total: ${total}`);
console.log(`Progress: ${((total - todos) / total * 100).toFixed(2)}%`);
