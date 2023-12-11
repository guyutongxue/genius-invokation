import data from "@gi-tcg/data";

export const maxEnergyData: Record<number, number> = Object.fromEntries(
  [...data.character.values()].map((c) => [c.id, c.constants.maxEnergy])
);
export const initiativeSkillData: Record<number, number[]> = Object.fromEntries(
  [...data.character.values()].map((c) => [
    c.id,
    c.initiativeSkills.map((sk) => sk.id),
  ])
);
export const visibleVarData: Record<number, string | null> = Object.fromEntries(
  [...data.entity.values()].map((c) => [c.id, c.visibleVarName])
);
