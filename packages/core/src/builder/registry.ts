// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import type { Immutable } from "immer";
import { CardDefinition } from "../base/card";
import { CharacterDefinition } from "../base/character";
import { EntityDefinition, VariableConfig } from "../base/entity";
import { ExtensionDefinition } from "../base/extension";
import {
  InitiativeSkillDefinition,
  SkillDefinition,
  TriggeredSkillDefinition,
} from "../base/skill";
import { GiTcgDataError } from "../error";
import { isCharacterInitiativeSkill } from "../utils";
import { CURRENT_VERSION, Version } from "../base/version";

let currentStore: DataStore | null = null;

export function beginRegistration() {
  if (currentStore !== null) {
    throw new GiTcgDataError("Already in registration");
  }
  currentStore = {
    characters: [],
    entities: [],
    skills: [],
    cards: [],
    passiveSkills: [],
    extensions: [],
  };
}

interface PassiveSkillDefinition {
  id: number;
  type: "passiveSkill";
  varConfigs: Record<string, VariableConfig>;
  skills: readonly TriggeredSkillDefinition[];
}

type DefinitionMap = {
  characters: CharacterDefinition;
  entities: EntityDefinition;
  skills: SkillDefinition;
  cards: CardDefinition;
  passiveSkills: PassiveSkillDefinition;
  extensions: ExtensionDefinition;
};

type RegisterCategory = keyof DefinitionMap;

export type DataStore = {
  [K in RegisterCategory]: DefinitionMap[K][];
};

export interface GameData {
  readonly version: Version;
  readonly extensions: readonly ExtensionDefinition[];
  readonly characters: readonly CharacterDefinition[];
  readonly entities: readonly EntityDefinition[];
  readonly skills: readonly SkillDefinition[];
  readonly cards: readonly CardDefinition[];
}

function getCurrentStore(): DataStore {
  if (currentStore === null) {
    throw new GiTcgDataError("Not in registration");
  }
  return currentStore;
}

function register<C extends RegisterCategory>(
  type: C,
  value: DefinitionMap[C],
) {
  const store = getCurrentStore()[type];
  store.push(value);
}
export function registerCharacter(value: CharacterDefinition) {
  register("characters", value);
}
export function registerEntity(value: EntityDefinition) {
  register("entities", value);
}
export function registerSkill(value: SkillDefinition) {
  register("skills", value);
}
export function registerPassiveSkill(value: PassiveSkillDefinition) {
  register("passiveSkills", value);
}
export function registerCard(value: CardDefinition) {
  register("cards", value);
}
export function registerExtension(value: ExtensionDefinition) {
  register("extensions", value);
}

function getDefinition<C extends RegisterCategory>(
  type: C,
  id: number,
): DefinitionMap[C] {
  const store = getCurrentStore();
  const result = store[type].find((obj) => obj.id === id);
  if (typeof result === "undefined") {
    throw new GiTcgDataError(`Unknown ${type} id ${id}`);
  }
  return result as DefinitionMap[C];
}

export function getCharacterSkillDefinition(
  id: number,
): InitiativeSkillDefinition<any> | PassiveSkillDefinition {
  try {
    const def = getDefinition("skills", id);
    if (!isCharacterInitiativeSkill(def)) {
      throw new GiTcgDataError("Skill found but not a character skill");
    }
    return def;
  } catch {}
  const def = getDefinition("passiveSkills", id);
  return def;
}

export type GameDataGetter = (version?: Version) => GameData;

export function endRegistration(): GameDataGetter {
  const store = getCurrentStore();
  return (version = CURRENT_VERSION) => ({
    version,
    extensions: store.extensions,
    characters: store.characters,
    entities: store.entities,
    skills: store.skills,
    cards: store.cards,
  });
}
