import { Aura, MethodNames, ResponseType, CharacterFacade, verifyRequest, verifyResponse, RequestType } from "@jenshin-tcg/typings";
import { Player } from ".";
import { State, WithPlayersState } from "./states";
import * as _ from "lodash-es";
import characterList from "./data/characters";
import { Character } from "./character";

export function initCharacter(objectId: number, index: number): Character {
  const constructor = characterList[objectId];
  if (typeof constructor === "undefined") {
    throw new Error("Unknown id");
  }
  return new Character(index, objectId, constructor.info);
}

export function randomDice(controlled?: number[]): number[] {
  controlled = controlled ?? [];
  for (let i = controlled.length; i < 8; i++) {
    controlled.push(Math.floor(1 + Math.random() * 8));
  }
  return [...controlled];
}
