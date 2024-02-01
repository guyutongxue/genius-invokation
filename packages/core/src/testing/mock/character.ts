import { Aura } from "@gi-tcg/typings";
import {
  ArkheTag,
  CharacterDefinition,
  CharacterTag,
  ElementTag,
  NationTag,
  WeaponTag,
} from "../../base/character";
import { mockBurstSkill, mockElementalSkill, mockNormalSkill } from "./skill";

const MOCK_CHARACTER_ID_START = 7000;
let mockCharacterId = MOCK_CHARACTER_ID_START;

export interface MockCharacterOption {
  element?: ElementTag;
  weapon?: WeaponTag;
  nation?: NationTag | NationTag[];
  arkhe?: ArkheTag;
  health?: number;
  energy?: number;
  maxHealth?: number;
  maxEnergy?: number;
  aura?: Aura;
}

export function mockCharacter(
  option: MockCharacterOption = {},
): CharacterDefinition {
  const element = option.element ?? "cryo";
  const energy = option.energy ?? 3;
  const tags: CharacterTag[] = [
    element,
    option.weapon ?? "other",
    ...(Array.isArray(option.nation)
      ? option.nation
      : option.nation
        ? [option.nation]
        : []),
    ...(option.arkhe ? [option.arkhe] : []),
  ];
  return {
    type: "character",
    tags,
    id: mockCharacterId++,
    constants: {
      health: option.health ?? 10,
      energy,
      aura: option.aura ?? Aura.None,
      alive: 1,
      maxHealth: option.maxHealth ?? 10,
      maxEnergy: option.maxEnergy ?? 3,
    },
    initiativeSkills: [
      mockNormalSkill(element),
      mockElementalSkill(element),
      mockBurstSkill(element, energy),
    ],
    skills: [],
  };
}
