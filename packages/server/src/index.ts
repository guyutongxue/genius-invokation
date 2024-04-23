import {
  Game,
  GameIO,
  NotificationMessage,
  PlayerConfig,
  PlayerIO,
  RpcMethod,
} from "@gi-tcg/core";
import data from "@gi-tcg/data";
import { Elysia, t, Static } from "elysia";
import { logger } from "@bogeychan/elysia-logger";
import { parseArgs } from "node:util";
import { AgentType, playerIoFromAgent } from "./agents";

const JSON_RPC_REQUEST_T = t.Object(
  {
    jsonrpc: t.Const("2.0" as const),
    method: t.String(),
    params: t.Optional(t.Any()),
    id: t.Optional(t.Union([t.String(), t.Number()])),
  },
  { description: "JSON-RPC request" },
);
const JSON_RPC_RESPONSE_SUCCESS_T = t.Object(
  {
    jsonrpc: t.Const("2.0" as const),
    result: t.Any(),
    id: t.Union([t.String(), t.Number()]),
  },
  { description: "JSON-RPC response success" },
);
const JSON_RPC_RESPONSE_ERROR_T = t.Object(
  {
    jsonrpc: t.Const("2.0" as const),
    error: t.Object({
      code: t.Number(),
      message: t.String(),
      data: t.Optional(t.Any()),
    }),
    id: t.Union([t.String(), t.Number()]),
  },
  { description: "JSON-RPC response error" },
);
const CLIENT_MESSAGE_T = t.Union([
  JSON_RPC_REQUEST_T,
  JSON_RPC_RESPONSE_SUCCESS_T,
  JSON_RPC_RESPONSE_ERROR_T,
]);

type JsonRpcRequest = Static<typeof JSON_RPC_REQUEST_T>;
type JsonRpcResponseSuccess = Static<typeof JSON_RPC_RESPONSE_SUCCESS_T>;
type JsonRpcResponseError = Static<typeof JSON_RPC_RESPONSE_ERROR_T>;
type ClientMessage = Static<typeof CLIENT_MESSAGE_T>;

interface Callbacks {
  resolve: (data: unknown) => void;
  reject: (error: unknown) => void;
}

abstract class WsManager {
  private nextId = 1;
  private readonly pending = new Map<string | number, Callbacks>();

  constructor(
    protected readonly send: (data: unknown) => void,
    protected readonly close: () => void,
  ) {}

  onMessage(message: ClientMessage) {
    if ("method" in message) {
      this.onRequest(message);
    } else if ("result" in message) {
      this.onResponse(message);
    } else {
      this.onError(message);
    }
  }

  protected abstract onRequest(message: JsonRpcRequest): unknown;

  private onResponse(message: JsonRpcResponseSuccess) {
    const callback = this.pending.get(message.id);
    if (callback) {
      callback.resolve(message.result);
      this.pending.delete(message.id);
    }
  }
  private onError(message: JsonRpcResponseError) {
    const callback = this.pending.get(message.id);
    if (callback) {
      callback.reject(message.error);
      this.pending.delete(message.id);
    }
  }

  protected async sendRequest(method: string, params?: unknown) {
    const id = this.nextId++;
    this.send({ jsonrpc: "2.0", method, params, id });
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
  protected sendNotification(method: string, params?: unknown) {
    this.send({ jsonrpc: "2.0", method, params });
  }
  protected sendResult(id: string | number, result: unknown) {
    this.send({ jsonrpc: "2.0", result, id });
  }
  protected sendError(
    id: string | number,
    error: JsonRpcResponseError["error"],
  ) {
    this.send({ jsonrpc: "2.0", error, id });
  }
}

interface PlayerConfigWithAgent extends PlayerConfig {
  $useAgent?: AgentType | null;
}

class WsGame extends WsManager {
  private player0: PlayerConfigWithAgent | null = null;
  private player1: PlayerConfigWithAgent | null = null;
  private game: Game | null = null;

  private createGameIo(): GameIO {
    return {
      pause: async () => {},
      players: [this.createPlayerIo(0), this.createPlayerIo(1)],
    };
  }
  private createPlayerIo(who: 0 | 1): PlayerIO {
    const config = who === 0 ? this.player0 : this.player1;
    if (!config) throw new Error("Player not found");
    if (config.$useAgent) {
      return playerIoFromAgent(config.$useAgent);
    } else {
      return {
        notify: (n) => this.playerNotify(who, n),
        rpc: (m, arg) => this.playerRpc(who, m, arg),
        get giveUp() {
          return !!config;
        },
      };
    }
  }
  private playerNotify($who: 0 | 1, n: NotificationMessage) {
    this.sendNotification("notify", { $who, ...n });
  }
  private async playerRpc($who: 0 | 1, m: RpcMethod, arg: any): Promise<any> {
    return await this.sendRequest(m, { $who, ...arg });
  }

  private createGame() {
    if (this.game) return;
    if (this.player0 && this.player1) {
      const io = this.createGameIo();
      this.game = new Game({
        data,
        io,
        playerConfigs: [this.player0, this.player1],
      });
    }
  }
  private stopGame() {
    if (this.player0 === null && this.player1 === null) {
      this.game?.terminate();
      this.game = null;
      this.close();
    }
  }

  protected onRequest(message: JsonRpcRequest) {
    if (typeof message.id === "undefined") {
      return;
    }
    if (
      !(
        message.params &&
        "$who" in message.params &&
        [0, 1].includes(message.params.$who)
      )
    ) {
        this.sendError(message.id, {
          code: -32602,
          message: "Invalid params",
          data: "No $who field",
        });
      return;
    }
    const who = message.params.$who;
    switch (message.method) {
      case "ready":
        if (who === 0) {
          this.player0 = { ...message.params };
        } else {
          this.player1 = { ...message.params };
        }
        this.createGame();
        this.sendResult(message.id, 0);
        break;
      case "giveUp":
        if (who === 0) {
          this.player0 = null;
        } else {
          this.player1 = null;
        }
        this.stopGame();
        this.sendResult(message.id, 0);
        break;
      default:
          this.sendError(message.id, {
            code: -32601,
            message: "Method not found",
          });
        break;
    }
  }
}

const {
  values: { port, hostname },
} = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: {
      type: "string",
      default: process.env.PORT ?? "3000",
    },
    hostname: {
      type: "string",
      default: process.env.HOSTNAME ?? "localhost",
    },
  },
});

const app = new Elysia()
  .use(logger())
  .decorate("game", null as WsGame | null)
  .ws("/play", {
    body: CLIENT_MESSAGE_T,
    open(ws) {
      if (ws.data.game) {
        ws.close();
        return;
      }
      ws.data.game = new WsGame(
        (data) => ws.send(data),
        () => ws.close(),
      );
    },
    close(ws) {
      ws.data.game = null;
    },
    message(ws, message) {
      ws.data.game?.onMessage(message);
    },
  })
  .listen({ hostname, port }, ({ hostname, port }) => {
    console.log(`@gi-tcg/server running at http://${hostname}:${port}`);
  });
