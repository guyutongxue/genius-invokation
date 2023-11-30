import { generateCards } from "./cards";
import { generateCharacters } from "./characters";
import { generateImports } from "./imports";

await Promise.all([
  generateCharacters(),
  generateCards()
]);
await generateImports();
