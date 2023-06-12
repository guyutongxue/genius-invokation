import { Aura, MethodNames, ResponseType, CharacterFacade, verifyRequest, verifyResponse } from "@jenshin-tcg/typings";
import { Player } from ".";
import { State, WithPlayersState } from "./states";
import * as _ from "lodash-es";
import characterList from "./characters";
import { Character } from "./character";

export function initCharacter(id: number): Character {
  const constructor = characterList[id];
  if (typeof constructor === "undefined") {
    throw new Error("Unknown id");
  }
  return new Character(id, constructor.info);
}

export async function requestPlayer<K extends MethodNames>(p: Player, method: K, params: unknown): Promise<ResponseType<K>> {
  let e = verifyRequest(method, params);
  if (e) {
    throw new Error(`Invalid request: ${e})`);
  }
  const response = await p.handle(method, params);
  e = verifyResponse(method, response);
  if (e) {
    throw new Error(`Invalid response: ${e})`);
  }
  return response as ResponseType<K>;
}

export function randomDice(controller?: unknown): number[] {
  const dice = [];
  for (let i = 0; i < 8; i++) {
    dice.push(Math.floor(1 + Math.random() * 8));
  }
  return dice;
}
