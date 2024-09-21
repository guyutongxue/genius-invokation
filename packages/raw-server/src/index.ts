// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  Game,
  GameIO,
  NotificationMessage,
  PlayerConfig,
  PlayerIO,
  RpcMethod,
} from "@gi-tcg/core";
import data from "@gi-tcg/data";
import { Elysia, t } from "elysia";
import { parseArgs } from "node:util";
import { AgentType, playerIoFromAgent } from "./agents";
import {
  CLIENT_MESSAGE_T,
  ClientMessage,
  JsonRpcRequest,
  JsonRpcResponseError,
  JsonRpcResponseSuccess,
  validateGiveUpParam,
  validateReadyParam,
} from "./schema";
import indexHtml from "./index.html";

interface Callbacks {
  resolve: (data: unknown) => void;
  reject: (error: unknown) => void;
}

abstract class WsJsonRpcBase {
  private nextId = 1;
  private readonly pending = new Map<string | number, Callbacks>();

  constructor(
    protected readonly send: (data: unknown) => void,
    protected readonly close: () => void,
  ) {}

  onMessage(message: ClientMessage) {
    if ("method" in message) {
      this.onRpcRequest(message);
    } else if ("result" in message) {
      this.onRpcResponse(message);
    } else {
      this.onRpcError(message);
    }
  }

  protected abstract onRpcRequest(message: JsonRpcRequest): unknown;

  private onRpcResponse(message: JsonRpcResponseSuccess) {
    const callback = this.pending.get(message.id);
    if (callback) {
      callback.resolve(message.result);
      this.pending.delete(message.id);
    }
  }
  private onRpcError(message: JsonRpcResponseError) {
    const callback = this.pending.get(message.id);
    if (callback) {
      callback.reject(message.error);
      this.pending.delete(message.id);
    }
  }

  protected async sendRpcRequest(method: string, params?: unknown) {
    const id = this.nextId++;
    this.send({ jsonrpc: "2.0", method, params, id });
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
  protected sendRpcNotification(method: string, params?: unknown) {
    this.send({ jsonrpc: "2.0", method, params });
  }
  protected sendRpcResult(id: string | number, result: unknown) {
    this.send({ jsonrpc: "2.0", result, id });
  }
  protected sendRpcError(
    id: string | number,
    error: JsonRpcResponseError["error"],
  ) {
    this.send({ jsonrpc: "2.0", error, id });
  }
}

interface PlayerConfigWithAgent extends PlayerConfig {
  $useAgent?: AgentType | null;
}

interface NotificationSubscription {
  who: 0 | 1;
  cb: (n: NotificationMessage | null) => void;
}

class WsGame extends WsJsonRpcBase {
  private players: [
    PlayerConfigWithAgent | null,
    PlayerConfigWithAgent | null,
  ] = [null, null];
  private game: Game | null = null;

  private lastNotification: (NotificationMessage | null)[] = [null, null];
  private notificationSubscriptions: NotificationSubscription[] = [];

  private setNotification(who: 0 | 1, n: NotificationMessage) {
    this.lastNotification[who] = n;
    for (const { who: w, cb } of this.notificationSubscriptions) {
      if (w === who) {
        cb(n);
      }
    }
  }
  subscribeNotification(
    who: 0 | 1,
    cb: (n: NotificationMessage | null) => void,
  ) {
    const n = this.lastNotification[who];
    if (n) {
      cb(n);
    }
    const sub = { who, cb };
    this.notificationSubscriptions.push(sub);
    return {
      unsubscribe: () => {
        const index = this.notificationSubscriptions.indexOf(sub);
        if (index !== -1) {
          this.notificationSubscriptions.splice(index, 1);
        }
      },
    };
  }
  private cleanNotificationSubscriptions() {
    for (const { cb } of this.notificationSubscriptions) {
      cb(null);
    }
    this.notificationSubscriptions = [];
  }

  private createGameIo(): GameIO {
    return {
      pause: async () => {},
      players: [this.createPlayerIo(0), this.createPlayerIo(1)],
      onIoError: (e) => {
        console.error(e);
        const config = this.players[e.who];
        if (config && !config.$useAgent) {
          this.sendRpcNotification("error", {
            $who: e.who,
            message: e.message,
          });
        }
      },
    };
  }
  private createPlayerIo(who: 0 | 1): PlayerIO {
    const config = this.players[who];
    if (!config) throw new Error("Player not found");
    if (config.$useAgent) {
      const io = playerIoFromAgent(config.$useAgent);
      return {
        ...io,
        notify: (n) => {
          this.setNotification(who, n);
          io.notify(n);
        },
      };
    } else {
      return {
        notify: (n) => {
          this.setNotification(who, n);
          this.playerNotify(who, n);
        },
        rpc: (m, arg) => this.playerRpc(who, m, arg),
        get giveUp() {
          return !config;
        },
      };
    }
  }
  private playerNotify($who: 0 | 1, n: NotificationMessage) {
    this.sendRpcNotification("notify", { $who, ...n });
  }
  private async playerRpc($who: 0 | 1, m: RpcMethod, arg: any): Promise<any> {
    return await this.sendRpcRequest(m, { $who, ...arg });
  }

  private createGame() {
    if (this.game) return;
    if (this.players[0] && this.players[1]) {
      const io = this.createGameIo();
      this.game = new Game({
        data: data(),
        io,
        playerConfigs: [this.players[0], this.players[1]],
      });
      this.game
        .start()
        .catch(console.error)
        .then(() => {
          console.log(`Game End!`);
          this.game = null;
          this.cleanNotificationSubscriptions();
          this.close();
        });
      console.log(
        `Game started! You can open http://${hostname}:${port}?who=0 to view the game`,
      );
    }
  }

  protected onRpcRequest({ id, method, params }: JsonRpcRequest) {
    if (typeof id === "undefined") {
      return;
    }
    switch (method) {
      case "ready": {
        if (!validateReadyParam.Check(params)) {
          this.sendRpcError(id, {
            code: -32602,
            message: "Invalid params",
          });
          return;
        }
        const { $who, ...rest } = params;
        if (this.players[$who]) {
          this.sendRpcError(id, {
            code: -1,
            message: `Player ${$who} already ready`,
          });
        }
        this.players[$who] = rest;
        this.sendRpcResult(id, 0);
        this.createGame();
        break;
      }
      case "giveUp": {
        if (!validateGiveUpParam.Check(params)) {
          this.sendRpcError(id, {
            code: -32602,
            message: "Invalid params",
          });
          return;
        }
        const { $who } = params;
        if (this.players[$who] === null) {
          this.sendRpcError(id, {
            code: -2,
            message: `Player ${$who} not ready`,
          });
        }
        this.players[$who] = null;
        this.sendRpcResult(id, 0);
        break;
      }
      default: {
        this.sendRpcError(id, {
          code: -32601,
          message: "Method not found",
        });
        break;
      }
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

let game: WsGame | null = null;

const app = new Elysia()
  .get("/", ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf8";
    return Bun.file(indexHtml);
  })
  .get(
    "/api/notify/:id",
    async function* ({ params, error }) {
      if (game === null) {
        return error(404, "Game not started");
      }
      const id = Number(params.id) as 0 | 1;
      let resolver = Promise.withResolvers<NotificationMessage | null>();
      const sub = game.subscribeNotification(id, (msg) => {
        resolver.resolve(msg);
        resolver = Promise.withResolvers<NotificationMessage | null>();
      });
      while (true) {
        const value = await resolver.promise;
        if (value === null) {
          break;
        }
        // Generator doesn't implement text/event-stream protocol correctly
        // Should be fixed by https://github.com/elysiajs/elysia/pull/743 someday
        yield `event: message\ndata: ${JSON.stringify(value)}\n\n`;
      }
      sub.unsubscribe();
    },
    {
      params: t.Object({
        id: t.Union([t.Literal("0"), t.Literal("1")]),
      }),
    },
  )
  .ws("/play", {
    body: CLIENT_MESSAGE_T,
    open(ws) {
      if (game) {
        console.log(
          `Game already started with another client; the new incoming connection will be closed.`,
        );
        ws.close();
        return;
      }
      console.log(
        `WebSocket connected; Send ready messages to start the game.`,
      );
      game = new WsGame(
        (data) => ws.send(data),
        () => ws.close(),
      );
    },
    close(ws) {
      console.log(`Game ended. Listening for new connections.`);
      game = null;
    },
    message(ws, message) {
      game?.onMessage(message);
    },
  })
  .listen({ hostname, port }, ({ hostname, port }) => {
    console.log(
      `@gi-tcg/raw-server running at ws://${hostname}:${port}/play .`,
    );
  });
