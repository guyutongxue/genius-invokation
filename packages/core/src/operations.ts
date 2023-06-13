import { Aura, MethodNames, ResponseType, CharacterFacade, verifyRequest, verifyResponse } from "@jenshin-tcg/typings";
import { Player } from ".";
import { State, WithPlayersState } from "./states";
import * as _ from "lodash-es";
import characterList from "./characters";
import { Character } from "./character";

export function initCharacter(objectId: number, index: number): Character {
  const constructor = characterList[objectId];
  if (typeof constructor === "undefined") {
    throw new Error("Unknown id");
  }
  return new Character(index, objectId, constructor.info);
}

export async function requestPlayer<K extends MethodNames>(p: Player, method: K, params: unknown): Promise<ResponseType<K>> {
  verifyRequest(method, params);
  const response = await p.handle(method, params);
  verifyResponse(method, response);
  return response as ResponseType<K>;
}

export function randomDice(controller?: unknown): number[] {
  const dice = [];
  for (let i = 0; i < 8; i++) {
    dice.push(Math.floor(1 + Math.random() * 8));
  }
  return dice;
}
