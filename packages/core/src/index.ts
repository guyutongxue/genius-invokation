import { MethodNames, RequestType, ResponseType } from "@jenshin-tcg/typings";
import { flip } from "./utils";
import { initCharacter, randomDice } from "./operations";
import { Pair, StateManager } from "./states";

export interface Player {
  id: any;
  characters: number[];
  piles: number[];
  handle: <K extends MethodNames>(
    method: K,
    params: RequestType<K>
  ) => ResponseType<K>;
}

export interface GameOptions {
  pvp: true;
  players: Pair<Player>;
}

// Communicate with frontend, get two players' hands
// state_.piles[0].splice(0, 5);
// state_.piles[1].splice(0, 5);

// const state2: InitActiveState = {
//   ...state1,
//   type: "initActive",
//   hands: [
//     [0, 1, 2, 3, 4],
//     [10, 11, 12, 13, 14],
//   ],
// };

// const state3: RollPhaseState = {
//   ...state2,
//   type: "rollPhase",
//   actives: [0, 1],
// };

// const state4: ActionPhaseState = {
//   ...state3,
//   type: "actionPhase",
//   dice: [randomDice(), randomDice()],
//   turn: state3.nextTurn,
//   nextTurn: flip(state3.nextTurn),
// };

export function createGame(options: GameOptions): void {
  const m = new StateManager(options);
  m.run();
}

export type * from "@jenshin-tcg/typings";
