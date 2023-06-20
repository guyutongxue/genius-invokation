import { getCharacterData } from "@jenshin-tcg/data";
import { Character } from "./character";
import * as _ from "lodash-es";
import { Card } from "./card";

export function initCharacter(objectId: number, index: number): Character {
  const data = getCharacterData(objectId);
  if (typeof data === "undefined") {
    throw new Error("Unknown objectId");
  }
  return new Character(index, data);
}

export function initPiles(piles: number[]): Card[] {
  const mset = new Map<number, number>();
  const newPiles: number[] = [];
  for (const card of piles) {
    const count = mset.get(card) ?? 0;
    mset.set(card, count + 1);
    newPiles.push(card + count * 0.1);
  }
  return _.shuffle(newPiles).map(id => new Card(id));
}

export function randomDice(controlled?: number[]): number[] {
  controlled = controlled ?? [];
  for (let i = controlled.length; i < 8; i++) {
    controlled.push(Math.floor(1 + Math.random() * 8));
  }
  return [...controlled];
}

export function flip(x: 0 | 1): 0 | 1 {
  return (1 - x) as 0 | 1;
}

export function flipByWho(x: 0 | 1, who: 0 | 1): 0 | 1 {
  return who ? flip(x) : x;
}
