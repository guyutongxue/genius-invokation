import { Context } from "../contexts";
import { IGlobalEvents } from "./global";

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

export interface CardInfo {
  readonly objectId: number;
  readonly type: CardType;
  readonly tags?: CardTag[];
}

export interface ICard extends IGlobalEvents {
  enabled?: boolean;

  onUse(c: Context): void;
}
