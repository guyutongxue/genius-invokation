import { DiceType } from "@gi-tcg/typings";
import { CharacterContext, CharacterTag } from "./characters";
import { SummonContext } from "./summons";
import { CardHandle } from "./builders";
import { Context } from "./global";

export interface PlayCardContext<TargetT extends CardTargetDescriptor = CardTargetDescriptor> {
  readonly id: CardHandle;
  readonly info: CardInfo;

  readonly target: ContextOfTarget<TargetT>;
  isTalentOf(charId: number): boolean;
  isWeapon(): boolean;
}

export type CardTarget = {
  character: CharacterContext<true>;
  summon: SummonContext<true>;
};

export type CardTargetDescriptor = readonly (keyof CardTarget)[];

export type ContextOfTarget<TargetT extends CardTargetDescriptor> =
  TargetT extends readonly [
    infer First extends keyof CardTarget,
    ...infer Rest extends CardTargetDescriptor
  ]
  ? readonly [CardTarget[First], ...ContextOfTarget<Rest>]
  : readonly [];

export type FuzzyContextOfTarget = readonly (CardTarget[keyof CardTarget])[];

export type CardTag =
  | "legend" // 秘传
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

type CardInfoNoId = Omit<CardInfo, "id">;

export interface CardInfo {
  readonly id: number;
  readonly type: CardType;
  readonly costs: DiceType[];
  readonly tags: CardTag[];
  readonly showWhen: ShownOption;
  readonly target: CardTargetDescriptor;
  readonly filter: PlayCardFilter;
  readonly action: PlayCardAction;
}

export type PlayCardFilter<TargetT extends CardTargetDescriptor = any[]> =
  (c: Context<never, PlayCardContext<TargetT>, false>) => boolean;

export type PlayCardAction<TargetT extends CardTargetDescriptor = any[]> =
  (c: Context<never, PlayCardContext<TargetT>, true>) => AsyncGenerator<void>;

const allCards = new Map<number, CardInfo>();
export function registerCard(id: number, info: CardInfoNoId) {
  allCards.set(id, { ...info, id });
}
export function getCard(id: number) {
  if (!allCards.has(id)) {
    throw new Error(`Card ${id} not found`);
  }
  return allCards.get(id)!;
}
