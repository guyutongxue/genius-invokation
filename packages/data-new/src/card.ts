import { DiceType } from "@gi-tcg/typings";
import { CharacterTag } from "./character";
import { InitiativeSkillDefinition, SkillDefinition, SkillFilter } from "./skill";

export type CardTag =
  | "legend" // 秘传
  | "action" // 出战行动
  | "food"
  | "resonance" // 元素共鸣
  | "talent"
  | "artifact"
  | "weapon"
  | "bow"
  | "sword"
  | "catalyst"
  | "pole"
  | "claymore"
  | "artifact"
  | "ally"
  | "place"
  | "item";

export type CardType = "event" | "support" | "equipment";

export interface DeckRequirement {
  dualCharacterTag?: CharacterTag;
  character?: number;
}

export type CardTargetKind = ("character" | "entity")[];

export interface CardTarget {
  ids: number[]
}

export type PlayCardAction = InitiativeSkillDefinition<CardTarget>;
export type PlayCardFilter = SkillFilter<CardTarget>;

export interface CardDefinition {
  readonly id: number;
  readonly type: CardType;
  readonly costs: DiceType[];
  readonly tags: CardTag[];
  readonly deckRequirement: DeckRequirement;
  readonly target: CardTargetKind;
  readonly filter: PlayCardFilter;
  readonly action: PlayCardAction;
}
