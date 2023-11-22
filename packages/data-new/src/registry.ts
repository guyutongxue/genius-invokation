import { CharacterDefinition } from "./character";
import { EntityDefinition } from "./entity";
import { SkillDefinition } from "./skill";

const allCharacters = new Map<number, CharacterDefinition>();
const allEntities = new Map<number, EntityDefinition>();
const allSkills = new Map<number, SkillDefinition>();

function register(type: "character" | "entity" | "skill", store: Map<number, any>, value: { id: number }) {
  if (store.has(value.id)) {
    throw new Error(`Duplicate ${type} id ${value.id}`);
  }
  store.set(value.id, value);
}

export function registerCharacter(value: CharacterDefinition) {
  register("character", allCharacters, value);
}
export function registerEntity(value: EntityDefinition) {
  register("entity", allEntities, value);
}
export function registerSkill(value: SkillDefinition) {
  register("skill", allSkills, value);
}

export function getSkillDefinition(id: number) {
  const result = allSkills.get(id);
  if (typeof result === "undefined") {
    throw new Error(`Unknown skill id ${id}`);
  }
  return result;
}
export function getEntityDefinition(id: number) {
  const result = allEntities.get(id);
  if (typeof result === "undefined") {
    throw new Error(`Unknown entity id ${id}`);
  }
  return result;
}
