import { $, Glob } from "bun";

const protos = [... new Glob(`${import.meta.dirname}/../proto/*.proto`).scanSync()];

await $`bunx pbjs -t json-module -w es6 -o bundle.js ${protos}`;
await $`bunx pbjs -t static-module ${protos} | bunx pbts -o bundle.d.ts -`;
