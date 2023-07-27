import { Event, RpcMethod, RpcRequest, RpcResponse } from "@gi-tcg/typings";


export interface PlayerIO {
  notifyMe: (event: Event) => void;
  notifyOpp: (event: Event) => void;
  rpc: <M extends RpcMethod>(method: M, data: RpcRequest[M]) => Promise<RpcResponse[M]>;
}

export class IONotAvailableError extends Error {
  constructor() {
    super("IO not available");
  }
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
