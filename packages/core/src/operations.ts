import { getCharacterData } from "@jenshin-tcg/data";
import { Character } from "./character";

export function initCharacter(objectId: number, index: number): Character {
  const data = getCharacterData(objectId);
  if (typeof data === "undefined") {
    throw new Error("Unknown objectId");
  }
  return new Character(index, data);
}

export function randomDice(controlled?: number[]): number[] {
  controlled = controlled ?? [];
  for (let i = controlled.length; i < 8; i++) {
    controlled.push(Math.floor(1 + Math.random() * 8));
  }
  return [...controlled];
}
