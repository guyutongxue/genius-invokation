import { DiceType } from "@gi-tcg/typings";
import { CharacterContext, CharacterTag } from "./characters";
import { Context } from "./contexts";
import { SummonContext } from "./summons";

export type CardTarget = {
  character: CharacterContext;
  summon: SummonContext;
};

export type CardTargetDescriptor = readonly (keyof CardTarget)[];

export type ContextOfTarget<T extends CardTargetDescriptor> =
  T extends readonly [
    infer First extends keyof CardTarget,
    ...infer Rest extends CardTargetDescriptor
  ]
  ? readonly [CardTarget[First], ...ContextOfTarget<Rest>]
  : readonly [];

export type CardTag =
  | "action" // 出战行动
  | "food"
  | "resonance" // 元素共鸣
  | "talent"
  | "artifact"
  | "weaponBow"
  | "weaponSword"
  | "weaponCatalyst"
  | "weaponPole"
  | "weaponClaymore"
  | "artifact"
  | "ally"
  | "place"
  | "item";

export type CardType = "event" | "support" | "equipment";

export type ShownOption = boolean | {
  requiredDualCharacterTag: CharacterTag;
} | {
  requiredCharacter: number;
}

interface CardInfo {
  type: CardType;
  costs: DiceType[];
  tags: CardTag[];
  showWhen: ShownOption;
  target: CardTargetDescriptor;
  filter: PlayCardFilter;
  action: PlayCardAction;
}

export type CardInfoWithId = Readonly<CardInfo & { id: number }>;

export type PlayCardFilter<T extends CardTargetDescriptor = readonly any[]> = (
  this: ContextOfTarget<T>,
  c: Context
) => boolean;
export type PlayCardTargetFilter<
  T extends CardTargetDescriptor = readonly any[]
> = (...targets: ContextOfTarget<T>) => boolean;
export type PlayCardAction = (this: readonly any[], c: Context) => void;

const allCards = new Map<number, CardInfoWithId>();
export function registerCard(id: number, info: CardInfo) {
  allCards.set(id, { ...info, id });
}
export function getCard(id: number) {
  if (!allCards.has(id)) {
    throw new Error(`Card ${id} not found`);
  }
  return allCards.get(id)!;
}
