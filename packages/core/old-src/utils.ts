import { getCharacterData } from "@jenshin-tcg/data";
import { DiceType } from "@jenshin-tcg/typings";
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

export function verifyDice(used: DiceType[], required: DiceType[]): boolean {
  const requiredMap = new Map<DiceType, number>();
  for (const r of required) {
    if (r === DiceType.ENERGY) continue;
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  if (requiredMap.has(DiceType.OMNI)) {
    const requiredCount = requiredMap.get(DiceType.OMNI)!;
    if (requiredCount !== used.length) return false;
    const chosenMap = new Set<DiceType>(used);
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(DiceType.OMNI))
    );
  }
  const chosen2 = [...used];
  let voidCount = 0;
  for (const r of required) {
    if (r === DiceType.ENERGY) continue;
    if (r === DiceType.VOID) {
      voidCount++;
      continue;
    }
    const index = chosen2.indexOf(r);
    if (index === -1) {
      const omniIndex = chosen2.indexOf(DiceType.OMNI);
      if (omniIndex === -1) return false;
      chosen2.splice(omniIndex, 1);
      continue;
    }
    chosen2.splice(index, 1);
  }
  return chosen2.length === voidCount;
}

export function flip(x: 0 | 1): 0 | 1 {
  return (1 - x) as 0 | 1;
}

export function flipByWho(x: 0 | 1, who: 0 | 1): 0 | 1 {
  return who ? flip(x) : x;
}
