import { DiceType } from "@gi-tcg/typings";
import { CharacterTag } from "./character";
import {
  InitiativeSkillDefinition,
} from "./skill";
import { GameState } from "./state";

export type EquipmentTag =
  | "talent"
  | "artifact"
  | "weapon"
  | "bow"
  | "sword"
  | "catalyst"
  | "pole"
  | "claymore"
  | "artifact";

export type CardTag =
  | "legend" // 秘传
  | "action" // 出战行动
  | "food"
  | "resonance" // 元素共鸣
  | "ally"
  | "place"
  | "item"
  | EquipmentTag;

export type CardType = "event" | "support" | "equipment";

export interface DeckRequirement {
  dualCharacterTag?: CharacterTag;
  character?: number;
}

export type CardTargetKind = readonly ("character" | "summon")[];

export interface CardTarget {
  ids: number[];
}

export type PlayCardSkillDefinition = InitiativeSkillDefinition<CardTarget>;
export type PlayCardFilter = (state: GameState, ctx: CardTarget) => boolean;

export interface CardDefinition {
  readonly id: number;
  readonly type: CardType;
  readonly tags: CardTag[];
  readonly deckRequirement: DeckRequirement;
  readonly target: CardTargetKind;
  readonly filter: PlayCardFilter;
  readonly skillDefinition: PlayCardSkillDefinition;
}
