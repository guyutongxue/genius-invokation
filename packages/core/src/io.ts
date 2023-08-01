import {
  Event,
  NotificationMessage,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  verifyNotificationMessage,
  verifyRpcRequest,
  verifyRpcResponse,
} from "@gi-tcg/typings";
import { PlayerConfig } from "./game_interface.js";
import { Store, getData } from "./store.js";
import { flip } from "@gi-tcg/utils";

export interface PlayerIO {
  notifyMe: (event: Event) => void;
  notifyOpp: (event: Event) => void;
  rpc: <M extends RpcMethod>(
    method: M,
    data: RpcRequest[M]
  ) => Promise<RpcResponse[M]>;
}

export class IONotAvailableError extends Error {
  constructor() {
    super("IO not available");
  }
}

export function createIO(
  store: Store,
  configs: readonly [PlayerConfig, PlayerConfig]
): readonly [PlayerIO, PlayerIO] {
  function notifyPlayer(who: 0 | 1, event: Event) {
    const msg: NotificationMessage = {
      event,
      state: getData(store.state, who),
    };
    verifyNotificationMessage(msg);
    configs[who].onNotify?.(msg);
  }
  function forOne(who: 0 | 1): PlayerIO {
    return {
      notifyMe: (event: Event) => notifyPlayer(who, event),
      notifyOpp: (event: Event) => notifyPlayer(flip(who), event),
      rpc: async <M extends RpcMethod>(method: M, data: RpcRequest[M]) => {
        verifyRpcRequest(method, data);
        const resp = await configs[who].handler(method, data);
        verifyRpcResponse(method, resp);
        return resp;
      },
    };
  }
  return [forOne(0), forOne(1)] as const;
}

/*

  private async rpc<M extends RpcMethod>(
    method: M,
    data: RpcRequest[M]
  ): Promise<RpcResponse[M]> {
    if (ClonedObj in this) {
      throw new Error("Cannot call rpc in cloned player");
    }
    verifyRpcRequest(method, data);
    const resp = await this.config.handler(method, data);
    verifyRpcResponse(method, resp);
    return resp;
  }
  */
