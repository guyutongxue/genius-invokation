export { DiceType, DamageType } from "@jenshin-tcg/typings";

export * from "./decorators";

export * from "./interfaces/character";
export * from "./interfaces/skill";
export * from "./interfaces/status";

export * from "./contexts";

import { characterSymbol, statusSymbol } from "./decorators";
import { characterList, cardList, statusList } from "./list";

export function register(...args: any[]) {
  for (const arg of args) {
    if (characterSymbol in arg) {
      const data = arg[characterSymbol];
      characterList.push(data);
    } else if (statusSymbol in arg) {
      const data = arg[statusSymbol];
      statusList.push(data);
    }
  }
}
