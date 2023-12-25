import data from "@gi-tcg/data";
import { DiceType } from "@gi-tcg/typings";
import { diceToMap } from "@gi-tcg/utils";

export const maxEnergyData: Record<number, number> = Object.fromEntries(
  [...data.character.values()].map(
    (c) => [c.id, c.constants.maxEnergy] as const,
  ),
);

const initiativeSkillDefs = [...data.character.values()].flatMap(
  (c) => c.initiativeSkills,
);

export const initiativeSkillData: Record<number, number[]> = Object.fromEntries(
  [...data.character.values()].map(
    (c) => [c.id, c.initiativeSkills.map((sk) => sk.id)] as const,
  ),
);

export const costData: Record<
  number,
  Map<DiceType, number>
> = Object.fromEntries([
  ...[...data.card.values()].map(
    (c) => [c.id, diceToMap(c.skillDefinition.requiredCost)] as const,
  ),
  ...initiativeSkillDefs.map(
    (sk) => [sk.id, diceToMap(sk.requiredCost)] as const,
  ),
]);
