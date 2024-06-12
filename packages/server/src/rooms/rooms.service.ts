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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Injectable, NotFoundException } from "@nestjs/common";
import {
  type ActionRequest,
  type ActionResponse,
  type ChooseActiveRequest,
  type ChooseActiveResponse,
  type GameConfig,
  type GameStateLogEntry,
  GiTcgError,
  Game as InternalGame,
  type NotificationMessage,
  type PlayerConfig,
  type PlayerIO,
  type RerollDiceResponse,
  type RpcMethod,
  type RpcRequest,
  type RpcResponse,
  type SwitchHandsResponse,
  serializeGameStateLog,
  VERSION,
} from "@gi-tcg/core";
import data from "@gi-tcg/data";
import { type Deck, flip } from "@gi-tcg/utils";
import { Subject } from "rxjs";
import { IsInt, IsObject } from "class-validator";
import { verifyDeck } from "../utils";


interface RoomConfig extends GameConfig {
  initActionTime: number; // defaults 45
  rerollTime: number; // defaults 40
  roundTotalActionTime: number; // defaults 60
  actionTime: number; // defaults 25
}

interface CreateRoomConfig extends RoomConfig {
  hostWho: 0 | 1;
}

interface PlayerIOWithError extends PlayerIO {
  // notify: (notification: NotificationMessage) => void;
  // rpc: (method: RpcMethod, params: RpcRequest[RpcMethod]) => Promise<any>;
  onError: (e: GiTcgError) => void;
}

export interface SSENotification {
  type: "notification";
  data: NotificationMessage;
}
export interface SSERpc {
  type: "rpc";
  id: number;
  timeout: number;
  method: RpcMethod;
  params: RpcRequest[RpcMethod];
}
export interface SSEError {
  type: "error";
  message: string;
}
export type SSEPayload = SSENotification | SSERpc | SSEError;

export class GameActionResponseDto {
  @IsInt()
  id!: number;

  @IsObject()
  response!: RpcResponse[RpcMethod];
}

interface RpcResolver {
  id: number;
  method: RpcMethod;
  params: any;
  timeout: number;
  resolve: (response: any) => void;
}

class Player implements PlayerIOWithError {
  public readonly sse$ = new Subject<SSEPayload>();
  constructor(
    public readonly userId: number,
    public deck: Deck,
  ) {}
  giveUp = false;

  private _nextRpcId = 0;
  private _rpcResolver: RpcResolver | null = null;
  private _timeoutConfig: RoomConfig | null = null;
  private _roundTimeout: number | null = null;

  setTimeoutConfig(config: RoomConfig) {
    this._timeoutConfig = config;
  }
  resetRoundTimeout() {
    this._roundTimeout = this._timeoutConfig?.roundTotalActionTime ?? Infinity;
  }
  currentAction() {
    if (this._rpcResolver) {
      return {
        id: this._rpcResolver.id,
        timeout: this._rpcResolver.timeout,
        method: this._rpcResolver.method,
        params: this._rpcResolver.params,
      };
    } else {
      return null;
    }
  }

  receiveResponse(response: GameActionResponseDto) {
    if (!this._rpcResolver) {
      throw new NotFoundException(`No rpc now`);
    } else if (this._rpcResolver.id !== response.id) {
      throw new NotFoundException(`Rpc id not match`);
    }
    this._rpcResolver.resolve(response.response);
  }

  notify(notification: NotificationMessage) {
    this.sse$.next({ type: "notification", data: notification });
  }

  private timeoutRpc(method: RpcMethod, params: RpcRequest[RpcMethod]) {
    if (method === "action") {
      const { candidates } = params as ActionRequest;
      const declareEndIdx = candidates.findIndex(
        (c) => c.type === "declareEnd",
      );
      const result: ActionResponse = {
        chosenIndex: declareEndIdx,
        cost: [],
      };
      return result;
    } else if (method === "chooseActive") {
      const { candidates } = params as ChooseActiveRequest;
      const result: ChooseActiveResponse = {
        active: candidates[0],
      };
      return result;
    } else if (method === "rerollDice") {
      const result: RerollDiceResponse = {
        rerollIndexes: [],
      };
      return result;
    } else if (method === "switchHands") {
      const result: SwitchHandsResponse = {
        removedHands: [],
      };
      return result;
    }
  }

  async rpc(method: RpcMethod, params: RpcRequest[RpcMethod]): Promise<any> {
    const id = this._nextRpcId++;
    let timeout: number;
    if (method === "rerollDice") {
      timeout = this._timeoutConfig?.rerollTime ?? Infinity;
    } else if (this._roundTimeout !== null) {
      timeout =
        this._roundTimeout + (this._timeoutConfig?.actionTime ?? Infinity);
    } else {
      timeout = this._timeoutConfig?.initActionTime ?? Infinity;
    }
    const payload: SSERpc = { type: "rpc", id, timeout, method, params };
    this.sse$.next(payload);
    return new Promise((resolve) => {
      const resolver: RpcResolver = {
        id,
        method,
        params,
        timeout,
        resolve: (r) => {
          clearInterval(interval);
          this._rpcResolver = null;
          resolve(r);
        },
      };
      this._rpcResolver = resolver;
      const interval = setInterval(() => {
        resolver.timeout--;
        if (resolver.timeout <= -2) {
          clearInterval(interval);
          this._rpcResolver = null;
          resolve(this.timeoutRpc(method, params));
        }
      }, 1000);
    });
  }

  onError(e: GiTcgError) {
    this.sse$.next({ type: "error", message: e.message });
  }
}

class Room {
  public static readonly VERSION = VERSION
  private game: InternalGame | null = null;
  private hostWho: 0 | 1;
  private host: Player | null = null;
  private guest: Player | null = null;
  private stateLog: GameStateLogEntry[] = [];
  private terminated = false;

  constructor(private readonly config: CreateRoomConfig) {
    this.hostWho = config.hostWho;
  }

  setHost(player: Player) {
    this.host = player;
    return this.hostWho;
  }
  setGuest(player: Player) {
    this.guest = player;
    return flip(this.hostWho);
  }
  start() {
    if (this.terminated) {
      throw new Error("room terminated");
    }
    if (this.host === null || this.guest === null) {
      throw new Error("player not ready");
    }
    verifyDeck(this.host.deck);
    verifyDeck(this.guest.deck);
    let playerConfig0: PlayerConfig;
    let playerConfig1: PlayerConfig;
    let playerIo0: Player;
    let playerIo1: Player;
    if (this.hostWho === 0) {
      playerConfig0 = this.host.deck;
      playerIo0 = this.host;
      playerConfig1 = this.guest.deck;
      playerIo1 = this.guest;
    } else {
      playerConfig0 = this.guest.deck;
      playerIo0 = this.guest;
      playerConfig1 = this.host.deck;
      playerIo1 = this.host;
    }
    playerIo0.setTimeoutConfig(this.config);
    playerIo1.setTimeoutConfig(this.config);
    this.game = new InternalGame({
      data,
      gameConfig: this.config,
      playerConfigs: [playerConfig0, playerConfig1],
      io: {
        pause: async (state, mutations, canResume) => {
          this.stateLog.push({ state, canResume });
          for (const mut of mutations) {
            if (mut.type === "changePhase" && mut.newPhase === "roll") {
              playerIo0.resetRoundTimeout();
              playerIo1.resetRoundTimeout();
            }
          }
        },
        players: [playerIo0, playerIo1],
        onIoError: (e) => {
          playerIo0.onError(e);
          playerIo1.onError(e);
        },
      },
    });
    try {
      this.game.start();
    } catch (e) {
      if (e instanceof GiTcgError) {
        playerIo0.onError(e);
        playerIo1.onError(e);
      } else {
        throw e;
      }
    }
  }

  getStateLog() {
    return serializeGameStateLog(this.stateLog);
  }
}

@Injectable()
export class RoomsService {
  private rooms = new Map<number, Room>();
}
