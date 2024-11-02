import {
  Game,
  GameState,
  PlayerConfig,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/core";
import { SkillHandle } from "@gi-tcg/core/builder";
import { verifyRpcResponse } from "@gi-tcg/typings/verify";
import { Ref } from "./setup";

class IoController {
  constructor(
    private controller: TestController,
    private who: 0 | 1,
  ) {}

  skill(id: SkillHandle, ...targets: Ref[]) {
    // this.controller._resolve(this.who, {})
  }


}

class AwaitingRpc {
  private resolver: PromiseWithResolvers<RpcResponse[RpcMethod]> =
    Promise.withResolvers();
  constructor(
    public readonly who: 0 | 1,
    public readonly method: RpcMethod,
    public readonly request: RpcRequest[RpcMethod],
  ) {}

  resolve(response: unknown) {
    verifyRpcResponse(this.method, response);
    this.resolver.resolve(response);
  }

  get promise() {
    return this.resolver.promise;
  }
}

export class TestController {
  public readonly me = new IoController(this, 0);
  public readonly opp = new IoController(this, 1);

  public readonly game: Game;

  constructor(initState: GameState) {
    this.game = new Game(initState);
    // TODO: enable reroll
    const playerConfig: PlayerConfig = {
      allowTuningAnyDice: true,
      alwaysOmni: true,
    };
    this.game.players[0].config = playerConfig;
    this.game.players[1].config = playerConfig;
    this.game.players[0].io.rpc = <M extends RpcMethod>(
      method: M,
      request: RpcRequest[M],
    ) => {
      return this.rpc(0, method, request) as Promise<RpcResponse[M]>;
    };
    this.game.players[1].io.rpc = <M extends RpcMethod>(
      method: M,
      request: RpcRequest[M],
    ) => {
      return this.rpc(1, method, request) as Promise<RpcResponse[M]>;
    };
  }

  private stepping = Promise.withResolvers<void>();
  private awaitingRpc: AwaitingRpc | null = null;
  private async rpc(
    who: 0 | 1,
    method: RpcMethod,
    request: RpcRequest[RpcMethod],
  ) {
    if (this.awaitingRpc) {
      throw new Error(
        `Previous rpc (${this.awaitingRpc.who} ${this.awaitingRpc.method}) is not resolved, cannot send another rpc (${who} ${method})`,
      );
    }
    this.awaitingRpc = new AwaitingRpc(who, method, request);
    this.stepping.resolve();
    const response = await this.awaitingRpc.promise;
    this.awaitingRpc = null;
    this.stepping = Promise.withResolvers();
    return response;
  }

  _resolve(who: 0 | 1, response: RpcResponse[RpcMethod]) {
    if (!this.awaitingRpc) {
      throw new Error(`No rpc is pending now.`);
    }
    if (this.awaitingRpc.who !== who) {
      throw new Error(
        `Waiting for rpc from ${this.awaitingRpc.who}, cannot resolve rpc from ${who}`,
      );
    }
    this.awaitingRpc.resolve(response);
  }

  get state() {
    return this.game.state;
  }

  async step() {
    await this.stepping.promise;
    return this;
  }
}
