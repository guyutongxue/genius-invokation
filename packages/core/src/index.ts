import { MethodNames, RequestType, ResponseType } from "@jenshin-tcg/typings";
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

export function createGame(options: GameOptions): Promise<GameEndState> {
  const m = new StateManager(options);
  return m.run();
}

export type * from "@jenshin-tcg/typings";
