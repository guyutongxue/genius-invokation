import { CharacterTag, WeaponTag } from "./character";
import { InitiativeSkillDefinition } from "./skill";
import { CharacterState, GameState } from "./state";

export type WeaponCardTag = Exclude<WeaponTag, "other">;

export type EquipmentTag = "talent" | "artifact" | "weapon" | WeaponCardTag;

export type SupportTag = "ally" | "place" | "item";

export type CardTag =
  | "legend" // 秘传
  | "action" // 出战行动
  | "food"
  | "resonance" // 元素共鸣
  | EquipmentTag
  | SupportTag;

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
export type PlayCardFilter = (state: GameState, caller: CharacterState, ctx: CardTarget) => boolean;

export interface CardDefinition {
  readonly id: number;
  readonly type: CardType;
  readonly tags: readonly CardTag[];
  readonly deckRequirement: DeckRequirement;
  readonly target: CardTargetKind;
  readonly filter: PlayCardFilter;
  readonly skillDefinition: PlayCardSkillDefinition;
}
