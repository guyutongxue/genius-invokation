import { CardDefinition } from "./card";
import { CharacterDefinition } from "./character";
import { EntityDefinition } from "./entity";
import { SkillDefinition } from "./skill";

const allCharacters = new Map<number, CharacterDefinition>();
const allEntities = new Map<number, EntityDefinition>();
const allSkills = new Map<number, SkillDefinition>();
const allCards = new Map<number, CardDefinition>();

type RegisterCategory = "character" | "entity" | "skill" | "card";

function register(type: RegisterCategory, store: Map<number, any>, value: { id: number }) {
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
export function registerCard(value: CardDefinition) {
  register("card", allCards, value);
}

function getDefinition<T>(type: RegisterCategory, store: Map<number, T>, id: number): T {
  const result = store.get(id);
  if (typeof result === "undefined") {
    throw new Error(`Unknown ${type} id ${id}`);
  }
  return result;
}
export function getCharacterDefinition(id: number) {
  return getDefinition("character", allCharacters, id);
}
export function getEntityDefinition(id: number) {
  return getDefinition("entity", allEntities, id);
}
export function getSkillDefinition(id: number) {
  return getDefinition("skill", allSkills, id);
}
export function getCardDefinition(id: number) {
  return getDefinition("card", allCards, id);
}
