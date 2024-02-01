import { Immutable } from "immer";
import { CardDefinition } from "../base/card";
import { CharacterDefinition } from "../base/character";
import { EntityDefinition } from "../base/entity";
import { SkillDefinition } from "../base/skill";

let currentStore: DataStore | null = null;

export function beginRegistration() {
  if (currentStore !== null) {
    throw new Error("Already in registration");
  }
  currentStore = {
    characters: new Map(),
    entities: new Map(),
    skills: new Map(),
    cards: new Map(),
  };
}

type DefinitionMap = {
  characters: CharacterDefinition;
  entities: EntityDefinition;
  skills: SkillDefinition;
  cards: CardDefinition;
};

type RegisterCategory = keyof DefinitionMap;

type DataStore = {
  [K in RegisterCategory]: Map<number, DefinitionMap[K]>;
};
export type ReadonlyDataStore = Immutable<DataStore>;

function getCurrentStore(): DataStore {
  if (currentStore === null) {
    throw new Error("Not in registration");
  }
  return currentStore;
}

function register<C extends RegisterCategory>(
  type: C,
  value: DefinitionMap[C],
) {
  const store = getCurrentStore()[type];
  if (store.has(value.id)) {
    throw new Error(`Duplicate ${type} id ${value.id}`);
  }
  store.set(value.id, value);
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
export function registerCard(value: CardDefinition) {
  register("cards", value);
}

function getDefinition<C extends RegisterCategory>(
  type: C,
  id: number,
): DefinitionMap[C] {
  const store = getCurrentStore();
  const result = store[type].get(id);
  if (typeof result === "undefined") {
    throw new Error(`Unknown ${type} id ${id}`);
  }
  return result;
}
export function getCharacterDefinition(id: number) {
  return getDefinition("characters", id);
}
export function getEntityDefinition(id: number) {
  return getDefinition("entities", id);
}
export function getSkillDefinition(id: number) {
  return getDefinition("skills", id);
}
export function getCardDefinition(id: number) {
  return getDefinition("cards", id);
}

export function getSkillDefinitionIncludePassive(
  id: number,
): SkillDefinition | EntityDefinition {
  try {
    return getSkillDefinition(id);
  } catch {}
  const def = getEntityDefinition(id);
  if (def.type !== "passiveSkill") {
    throw new Error(`Unknown skill id ${id}`);
  }
  return def;
}

export function endRegistration(): ReadonlyDataStore {
  return getCurrentStore();
}
