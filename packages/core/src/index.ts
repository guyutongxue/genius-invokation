import { MethodNames, RequestType, ResponseType } from "@jenshin-tcg/typings";
import { flip } from "./utils";
import { initCharacter, randomDice } from "./operations";
import { GameEndState, Pair, StateManager } from "./states";

export interface Player {
  id: any;
  characters: number[];
  piles: number[];
  handler: (method: MethodNames, params: RequestType<MethodNames>) => Promise<unknown>;
}

export interface GameOptions {
  pvp: true;
  players: Pair<Player>;
}

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

export function createGame(options: GameOptions): Promise<GameEndState> {
  const m = new StateManager(options);
  return m.run();
}

export type * from "@jenshin-tcg/typings";
