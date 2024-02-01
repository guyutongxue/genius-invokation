import { DiceType } from "@gi-tcg/typings";
import { InitiativeSkillDefinition, SkillType } from "../../base/skill";
import { ElementTag } from "../../base/character";
import { PlayCardSkillDefinition } from "../../base/card";

const MOCK_SKILL_ID_START = 70000;
let mockSkillId = MOCK_SKILL_ID_START;

export function mockInitiativeSkill(skillType: SkillType, cost: DiceType[]): InitiativeSkillDefinition & PlayCardSkillDefinition {
  return {
    type: "skill",
    skillType,
    id: mockSkillId++,
    triggerOn: null,
    requiredCost: cost,
    action: (st) => [st, []],
  };
}

const ELEMENT_MAP: Record<ElementTag, DiceType> = {
  anemo: DiceType.Anemo,
  cryo: DiceType.Cryo,
  dendro: DiceType.Dendro,
  electro: DiceType.Electro,
  geo: DiceType.Geo,
  hydro: DiceType.Hydro,
  pyro: DiceType.Pyro,
};

export function mockNormalSkill(element: ElementTag): InitiativeSkillDefinition {
  return mockInitiativeSkill("normal", [ELEMENT_MAP[element], DiceType.Void, DiceType.Void]);
}

export function mockElementalSkill(element: ElementTag): InitiativeSkillDefinition {
  return mockInitiativeSkill("elemental", [ELEMENT_MAP[element], ELEMENT_MAP[element], ELEMENT_MAP[element]]);
}

export function mockBurstSkill(element: ElementTag, energy: number): InitiativeSkillDefinition {
  const cost = [ELEMENT_MAP[element], ELEMENT_MAP[element], ELEMENT_MAP[element]];
  for (let i = 0; i < energy; i++) {
    cost.push(DiceType.Energy);
  }
  return mockInitiativeSkill("burst", cost);
}
