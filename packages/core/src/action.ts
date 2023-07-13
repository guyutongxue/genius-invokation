import { Card } from "./card.js";
import { Summon } from "./summon.js";
import { Character } from "./character.js";
import { DiceType } from "@gi-tcg/typings";
import { Skill } from "./skill.js";

export type UseSkillAction = {
  type: "useSkill",
  dice: DiceType[],
  skill: Skill,
}

export type PlayCardTargetObj = Summon | Character;

export type PlayCardAction = {
  type: "playCard",
  dice: DiceType[],
  card: Card,
  targets: PlayCardTargetObj[]
}

export type SwitchActiveAction = {
  type: "switchActive",
  dice: DiceType[],
  from: Character,
  to: Character
}

export type OtherAction = {
  type: "declareEnd" | "elementalTuning",
  dice: DiceType[],
}

export type Action = UseSkillAction | PlayCardAction | SwitchActiveAction | OtherAction;
