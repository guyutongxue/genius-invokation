import { $ } from "bun";
import { resolve } from "node:path";

await $`bunx buf generate`.cwd(`${import.meta.dirname}/../../..`);
