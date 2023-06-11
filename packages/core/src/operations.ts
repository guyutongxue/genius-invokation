import { Application, Character } from "@jenshin-tcg/typings";
import characterList from "./characters";

export function initCharacter(id: number): Character {
  const constructor = characterList[id];
  return {
    id,
    health: constructor.info.health,
    applied: Application.NONE,
    statuses: []
  };
}

export function randomDice(controller?: unknown): number[] {
  const dice = [];
  for (let i = 0; i < 8; i++) {
    dice.push(Math.floor(1 + Math.random() * 8));
  }
  return dice;
}
