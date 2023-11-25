import { Event, RpcMethod, RpcRequest, RpcResponse } from "@gi-tcg/typings";
import { GameState } from ".";

export interface PlayerIO {
  giveUp: boolean;
  notify: (event: Event) => void;
  rpc: <M extends RpcMethod>(method: M, data: RpcRequest[M]) => Promise<RpcResponse[M]>;
}

export interface GameIO {
  pause: (st: GameState) => Promise<void>,
  players: [PlayerIO, PlayerIO]
}
