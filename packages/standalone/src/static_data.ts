import data from "@gi-tcg/data";
import { DiceType } from "@gi-tcg/typings";

export const maxEnergyData: Record<number, number> = Object.fromEntries(
  [...data.character.values()].map((c) => [c.id, c.constants.maxEnergy] as const),
);

const initiativeSkillDefs = [...data.character.values()].flatMap(
  (c) => c.initiativeSkills,
);

export const initiativeSkillData: Record<number, number[]> = Object.fromEntries(
  [...data.character.values()].map((c) => [
    c.id,
    c.initiativeSkills.map((sk) => sk.id),
  ] as const),
);

export const visibleVarData: Record<number, string | null> = Object.fromEntries(
  [...data.entity.values()].map((c) => [c.id, c.visibleVarName] as const),
);

function sparseCostToMap(cost: readonly DiceType[]): Map<DiceType, number> {
  const result: Map<DiceType, number> = new Map();
  for (const d of cost) {
    if (result.has(d)) {
      result.set(d, result.get(d)! + 1);
    } else {
      result.set(d, 1);
    }
  }
  return result;
}

export const costData: Record<number, Map<DiceType, number>> = Object.fromEntries(
  [
    ...[...data.card.values()].map((c) => [c.id, sparseCostToMap(c.skillDefinition.costs)] as const),
    ...initiativeSkillDefs.map((sk) => [sk.id, sparseCostToMap(sk.costs)] as const),
  ],
);
