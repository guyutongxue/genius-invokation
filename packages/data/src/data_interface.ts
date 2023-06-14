export { DiceType, DamageType } from "@jenshin-tcg/typings";

export * from "./decorators";

export * from "./interfaces/global";

export * from "./contexts";

import { cardSymbol, characterSymbol, statusSymbol } from "./decorators";
import { characterList, cardList, statusList } from "./list";

export function register(...args: any[]) {
  for (const arg of args) {
    if (characterSymbol in arg) {
      const data = arg[characterSymbol];
      characterList.push(data);
    } else if (statusSymbol in arg) {
      const data = arg[statusSymbol];
      statusList.push(data);
    } else if (cardSymbol in arg) {
      const data = arg[cardSymbol];
      cardList.push(data);
    }
  }
}
