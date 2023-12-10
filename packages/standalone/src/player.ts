import {
  PlayerConfig,
  PlayerIO,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  StateData,
} from "@gi-tcg/core";
import { ref } from "vue";

export class Player {
  public readonly io: PlayerIO;

  public readonly state = ref<StateData>();
  public readonly outlined = ref<number[]>([]);
  public readonly selected = ref<number[]>([]);

  constructor(
    public readonly config: PlayerConfig,
    public readonly who: 0 | 1,
  ) {
    this.io = {
      giveUp: false,
      notify: ({ newState, events, mutations }) => {
        this.state.value = newState;
      },
      rpc: (m, r) => this.rpc(m, r),
    };
  }

  async rpc<M extends RpcMethod>(
    m: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[M]> {
    const res = await this.doRpc(m, req);
    console.log("rpc", this.who, m, req, res);
    return res as RpcResponse[M];
  }

  private async doRpc<M extends RpcMethod>(
    m: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[RpcMethod]> {
    switch (m) {
      case "chooseActive":
        const { candidates } = req as RpcRequest["chooseActive"];
        return {
          active: candidates[0],
        } as RpcResponse["chooseActive"];
      case "rerollDice":
        return {
          rerollIndexes: [],
        } as RpcResponse["rerollDice"];
      default:
        throw new Error("Not implemented");
    }
  }
}
