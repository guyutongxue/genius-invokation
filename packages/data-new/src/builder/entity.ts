import { TriggeredSkillBuilder } from "./skill";




export function summon(id: number) {
  return new TriggeredSkillBuilder("summon", id);
}

export function status(id: number) {
  return new TriggeredSkillBuilder("status", id);
}

export function combatStatus(id: number) {
  return new TriggeredSkillBuilder("combatStatus", id);
}
