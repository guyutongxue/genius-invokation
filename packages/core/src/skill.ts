import {
  NormalSkillInfo,
  PassiveSkillInfo,
  SkillInfo,
  getSkill,
} from "@gi-tcg/data";
import { Entity } from "./entity.js";
import { GameState, getCharacterAtPath } from "./store.js";

export class Skill extends Entity {
  constructor(public readonly info: Exclude<SkillInfo, PassiveSkillInfo>) {
    super(info.id);
  }

  async do(ctx: SkillDescriptionContext) {
    return this.info.action(ctx);
  }
}

export function getSkillEx(
  state: GameState,
  who: 0 | 1,
  skill: "normal" | number
): NormalSkillInfo {
  const character = getCharacterAtPath(state, state.players[who].active!);
  if (skill === "normal") {
    return character.info.skills
      .map(getSkill)
      .filter((x): x is NormalSkillInfo => x.type === "normal")[0];
  } else {
    const s = getSkill(skill);
    if (s.type === "passive") {
      throw new Error(`Skill ${skill} is passive`);
    }
    return s;
  }
}
