import { Context } from "../contexts";
import { ICharacter, IGlobalEvents } from "./global";

export type CardTag =
  | "action" // 出战行动
  | "food"
  | "talent"
  | "artifact"
  | "weaponBow"
  | "weaponSword"
  | "weaponCatalyst"
  | "weaponPole"
  | "weaponClaymore"
  | "artifact"
  | "assist"
  | "ally"
  | "place"
  | "item";

export type CardType = "event" | "support" | "equipment";

type CardWithInfo = {
  readonly type: "character" | "support" | "summon";
  readonly who: 0 | 1;
};

export type CardWith =
  | { type: "character"; character: ICharacter }
  | { type: "support" }
  | { type: "summon"; summon: unknown };

export interface CardInfo {
  readonly objectId: number;
  readonly type: CardType;
  readonly tags?: CardTag[];
  readonly with?: CardWithInfo[];
}

export interface CardEnableTester extends IGlobalEvents {
  readonly enabled: boolean;
}

export interface ICard {
  onUse(c: Context): void;
}
export interface ICardConstructor {
  new (...args: (ICharacter | unknown)[]): ICard;
  enableTester?: new () => CardEnableTester;
  checkWith?(...args: (ICharacter | unknown)[]): boolean;
}
