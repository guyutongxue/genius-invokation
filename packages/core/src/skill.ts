import { NormalSkillInfo, getSkill } from "@gi-tcg/data";
import { EntityPath, SkillPath } from "./entity.js";
import { GameState, Store, getCharacterAtPath } from "./store.js";
import { SkillContextImpl, mixinExt } from "./context.js";
import { CharacterPath } from "./character.js";

export function getSkillEx(
  state: GameState,
  who: 0 | 1,
  skill: "normal" | number,
): SkillPath {
  const chPath = state.players[who].active!;
  const character = getCharacterAtPath(state, chPath);
  if (skill === "normal") {
    return skillInfoToPath(
      chPath,
      character.info.skills
        .map(getSkill)
        .filter((x): x is NormalSkillInfo => x.type === "normal")[0],
    );
  } else {
    const s = getSkill(skill);
    if (s.type === "passive") {
      throw new Error(`Skill ${skill} is passive`);
    }
    return skillInfoToPath(chPath, s);
  }
}

export function skillInfoToPath(
  chPath: CharacterPath,
  skill: NormalSkillInfo,
): SkillPath {
  return {
    who: chPath.who,
    type: "skill",
    character: chPath,
    info: skill,
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
