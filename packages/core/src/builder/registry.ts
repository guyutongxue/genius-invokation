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

import { CardDefinition } from "../base/card";
import { CharacterDefinition } from "../base/character";
import { EntityDefinition, VariableConfig } from "../base/entity";
import { ExtensionDefinition } from "../base/extension";
import {
  SkillDefinition,
  TriggeredSkillDefinition,
} from "../base/skill";
import { GiTcgDataError } from "../error";
import { CURRENT_VERSION, Version, VersionInfo } from "../base/version";

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
  version: VersionInfo,
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
  if ("version" in value) {
    const sameIdObjects = store.filter((obj) => obj.id === value.id);
    if (
      value.version.predicate === "since" &&
      sameIdObjects.some(
        (obj) => "version" in obj && obj.version.predicate === "since",
      )
    ) {
      throw new GiTcgDataError(
        `Duplicate since version definition for ${type} id ${value.id}`,
      );
    } else {
      if (
        sameIdObjects.some(
          (obj) =>
            "version" in obj && obj.version.version === value.version.version,
        )
      ) {
        throw new GiTcgDataError(
          `Duplicate until version definition for ${type} id ${value.id}`,
        );
      }
    }
  }
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

export function getCharacterSkillDefinition(
  id: number,
  untilVer?: string
): number | PassiveSkillDefinition {
  const allPassiveSkills = getCurrentStore().passiveSkills;
  const def = allPassiveSkills.find((sk) => {
    if (sk.id !== id) {
      return false;
    }
    if (typeof untilVer === "undefined") {
      return sk.version.predicate === "since";
    } else {
      return sk.version.predicate === "until" && sk.version.version === untilVer;
    }
  });
  if (typeof def !== "undefined") {
    return def;
  }
  // Assume this is a initiative skill
  return id;
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
