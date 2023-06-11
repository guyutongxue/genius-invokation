import { BehaviorSubject, EMPTY, Observable } from "rxjs";
import {
  State,
  CoinTossState,
  InitHandsState,
  InitActiveState,
  RollPhaseState,
  ActionPhaseState,
  Pair,
  RequestType,
  AllRequestTypes,
} from "@jenshin-tcg/typings";
import { flip } from "./utils";
import { initCharacter, randomDice } from "./operations";

function initState(pvp = true): CoinTossState {
  return {
    type: "coinToss",
  };
}

export interface Player {
  id: any;
  characters: number[];
  piles: number[];
}

export function main() {
  const player0: Player = {
    id: "A",
    characters: [0, 1, 2],
    piles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  };
  const player1: Player = {
    id: "B",
    characters: [3, 4, 5],
    piles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  };

  const state0 = initState();

  // Communicate with frontend, get two players' data

  const state1: InitHandsState = {
    ...state0,
    type: "initHands",
    players: [player0.id, player1.id],
    characters: [
      player0.characters.map(initCharacter),
      player1.characters.map(initCharacter),
    ],
    combatStatuses: [[], []],
    piles: [player0.piles, player1.piles],
    summons: [[], []],
    supports: [[], []],
    nextTurn: 0,
  };

  // Communicate with frontend, get two players' hands
  state1.piles[0].splice(0, 5);
  state1.piles[1].splice(0, 5);

  const state2: InitActiveState = {
    ...state1,
    type: "initActive",
    hands: [
      [0, 1, 2, 3, 4],
      [10, 11, 12, 13, 14],
    ],
  };

  const state3: RollPhaseState = {
    ...state2,
    type: "rollPhase",
    actives: [0, 1],
  };

  const state4: ActionPhaseState = {
    ...state3,
    type: "actionPhase",
    dice: [randomDice(), randomDice()],
    turn: state3.nextTurn,
    nextTurn: flip(state3.nextTurn),
  };
}

export interface GameOptions {
  pvp: true;
  players: Pair<Player>;
}

export function createGame(
  options: GameOptions
): Pair<Observable<AllRequestTypes>> {
  const stateSubject = new BehaviorSubject<State>(initState(options.pvp));

  return [EMPTY, EMPTY];
}
