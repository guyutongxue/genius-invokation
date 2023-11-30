import { NormalSkillInfo, getSkill } from "@gi-tcg/data";
import { EntityPath, SkillPath } from "./entity.js";
import { GameState, Store, getCharacterAtPath } from "./store.js";
import { SkillContextImpl, mixinExt } from "./context.js";
import { CharacterPath } from "./character.js";

export function getSkillEx(
  state: GameState,
  who: 0 | 1 | CharacterPath,
  skill: "normal" | number,
): SkillPath {
  const player = typeof who === "number" ? who : who.who;
  const chPath = typeof who === "number" ? state.players[player].active! : who;
  const character = getCharacterAtPath(state, chPath);
  const charged = state.players[player].dice.length % 2 === 0;
  const plunging = state.players[player].canPlunging;
  if (skill === "normal") {
    return skillInfoToPath(
      chPath,
      character.info.skills
        .map(getSkill)
        .filter((x): x is NormalSkillInfo => x.type === "normal")[0],
      charged,
      plunging,
    );
  } else {
    const s = getSkill(skill);
    if (s.type === "passive") {
      throw new Error(`Skill ${skill} is passive`);
    }
    return skillInfoToPath(
      chPath,
      s,
      charged && s.type === "normal",
      plunging && s.type === "normal",
    );
  }
}

function skillInfoToPath(
  chPath: CharacterPath,
  skill: NormalSkillInfo,
  charged: boolean,
  plunging: boolean,
): SkillPath {
  return {
    who: chPath.who,
    type: "skill",
    character: chPath,
    info: skill,
    charged,
    plunging,
  };
}

export async function useSkill(
  store: Store,
  caller: EntityPath,
  path: SkillPath,
) {
  const skillCtx = new SkillContextImpl(store, caller, caller.who, path);
  return await path.info.action(mixinExt(store, path, skillCtx));
}
