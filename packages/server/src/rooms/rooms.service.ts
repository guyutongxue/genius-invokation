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

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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
import { type Deck, flip, decode } from "@gi-tcg/utils";
import { ReplaySubject, Subject } from "rxjs";
import { IsInt, IsObject } from "class-validator";
import { verifyDeck } from "../utils";
import type { CreateRoomDto } from "./rooms.controller";
import { DecksService } from "../decks/decks.service";
import { UsersService } from "../users/users.service";
import type { User } from "@prisma/client";

interface RoomConfig extends Partial<GameConfig> {
  initTotalActionTime: number; // defaults 45
  rerollTime: number; // defaults 40
  roundTotalActionTime: number; // defaults 60
  actionTime: number; // defaults 25
  watchable: boolean; // defaults false
}

interface CreateRoomConfig extends RoomConfig {
  hostWho: 0 | 1;
}

interface PlayerIOWithError extends PlayerIO {
  // notify: (notification: NotificationMessage) => void;
  // rpc: (method: RpcMethod, params: RpcRequest[RpcMethod]) => Promise<any>;
  onError: (e: GiTcgError) => void;
}

interface OppDeckInfo extends Deck {
  userId: number;
  userName: string | null;
}

export interface SSEInitialized {
  type: "initialized";
  who: 0 | 1;
  oppDeck: OppDeckInfo;
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
export type SSEPayload = SSEInitialized | SSENotification | SSERpc | SSEError;

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
  public readonly sse$ = new ReplaySubject<SSEPayload>();
  constructor(
    public readonly user: User,
    public deck: Deck,
  ) {}
  giveUp = false;

  private _nextRpcId = 0;
  private _rpcResolver: RpcResolver | null = null;
  private _timeoutConfig: RoomConfig | null = null;
  private _roundTimeout = Infinity;

  setTimeoutConfig(config: RoomConfig) {
    this._timeoutConfig = config;
    this._roundTimeout = this._timeoutConfig?.initTotalActionTime ?? Infinity;
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
    // 当前回合剩余时间
    const roundTimeout = this._roundTimeout;
    // 本行动可用时间
    let timeout: number;
    // 行动结束后，计算新的回合剩余时间
    let setRoundTimeout: (remained: number) => void;
    if (method === "rerollDice") {
      timeout = this._timeoutConfig?.rerollTime ?? Infinity;
      setRoundTimeout = () => {};
    } else {
      timeout = roundTimeout + (this._timeoutConfig?.actionTime ?? Infinity);
      setRoundTimeout = (remain) => {
        this._roundTimeout = Math.min(roundTimeout, remain + 1);
      };
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
          setRoundTimeout(resolver.timeout);
          this._rpcResolver = null;
          resolve(r);
        },
      };
      this._rpcResolver = resolver;
      const interval = setInterval(() => {
        resolver.timeout--;
        if (resolver.timeout <= -2) {
          clearInterval(interval);
          setRoundTimeout(0);
          this._rpcResolver = null;
          resolve(this.timeoutRpc(method, params));
        }
      }, 1000);
    });
  }

  onError(e: GiTcgError) {
    this.sse$.next({ type: "error", message: e.message });
  }
  onInitialized(who: 0 | 1, opp: Player) {
    this.sse$.next({
      type: "initialized",
      who,
      oppDeck: {
        userId: opp.user.id,
        userName: opp.user.name,
        cards: opp.deck.cards,
        characters: opp.deck.characters,
      },
    });
  }
}

type GameStopHandler = (winner: 0 | 1 | null) => void;

class Room {
  public static readonly VERSION = VERSION;
  private game: InternalGame | null = null;
  private hostWho: 0 | 1;
  private host: Player | null = null;
  private guest: Player | null = null;
  private stateLog: GameStateLogEntry[] = [];
  private terminated = false;
  private onStopHandlers: GameStopHandler[] = [];

  constructor(private readonly config: CreateRoomConfig) {
    this.hostWho = config.hostWho;
  }
  getHost() {
    return this.host;
  }
  get started() {
    return this.game !== null;
  }

  setHost(player: Player) {
    if (this.host !== null) {
      throw new ConflictException("host already set");
    }
    this.host = player;
    return this.hostWho;
  }
  setGuest(player: Player) {
    if (this.guest !== null) {
      throw new ConflictException("guest already set");
    }
    this.guest = player;
    return flip(this.hostWho);
  }
  start() {
    if (this.terminated) {
      throw new ConflictException("room terminated");
    }
    if (this.host === null || this.guest === null) {
      throw new ConflictException("player not ready");
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
    const game = new InternalGame({
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
    this.host.onInitialized(0, this.guest);
    this.guest.onInitialized(1, this.host);
    (async () => {
      try {
        this.game = game;
        const winner = await game.start();
        for (const cb of this.onStopHandlers) {
          cb(winner);
        }
      } catch (e) {
        if (e instanceof GiTcgError) {
          playerIo0.onError(e);
          playerIo1.onError(e);
        } else {
          throw e;
        }
      }
    })();
  }

  onStop(cb: GameStopHandler) {
    this.onStopHandlers.push(cb);
  }

  getStateLog() {
    return serializeGameStateLog(this.stateLog);
  }
}

// const A = 48271;
// const A_INV = 371631; // A^-1 in Z_1000000

@Injectable()
export class RoomsService {
  private rooms: (Room | null)[] = Array.from(
    { length: 1_000_000 },
    () => null,
  );

  constructor(
    private users: UsersService,
    private decks: DecksService,
  ) {}

  async createRoom(
    hostUserId: number,
    hostDeckId: number,
    params: CreateRoomDto,
  ) {
    const user = await this.users.findById(hostUserId);
    if (user === null) {
      throw new NotFoundException(`User ${hostUserId} not found`);
    }
    const deck = await this.decks.getDeck(hostUserId, hostDeckId);
    if (deck === null) {
      throw new NotFoundException(`Deck ${hostDeckId} not found`);
    }

    const hostWho =
      typeof params.hostFirst === "undefined"
        ? Math.random() > 0.5
          ? 0
          : 1
        : params.hostFirst
          ? 0
          : 1;
    const roomConfig: CreateRoomConfig = {
      hostWho,
      randomSeed: params.randomSeed,
      initTotalActionTime: params.initTotalActionTime ?? 45,
      rerollTime: params.rerollTime ?? 40,
      roundTotalActionTime: params.roundTotalActionTime ?? 60,
      actionTime: params.actionTime ?? 25,
      watchable: params.watchable ?? false,
    };
    const roomId = this.rooms.indexOf(null);
    if (roomId === -1) {
      throw new InternalServerErrorException("no room available");
    }
    const room = new Room(roomConfig);
    this.rooms[roomId] = room;
    room.onStop(() => {
      this.rooms[roomId] = null;
    });
    room.setHost(new Player(user, deck));
    return {
      roomId,
    };
  }

  deleteRoom(userId: number, roomId: number) {
    const room = this.rooms[roomId];
    if (room === null) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.started) {
      throw new ConflictException(`Room ${roomId} already started`);
    }
    if (room.getHost()?.user.id !== userId) {
      throw new UnauthorizedException(`You are not the host of room ${roomId}`);
    }
    this.rooms[roomId] = null;
  }

  async joinRoom(roomId: number, userId: number, deckId: number) {
    const room = this.rooms[roomId];
    if (room === null) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.started) {
      throw new ConflictException(`Room ${roomId} already started`);
    }
    const user = await this.users.findById(userId);
    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    const deck = await this.decks.getDeck(userId, deckId);
    if (deck === null) {
      throw new NotFoundException(`Deck ${deckId} not found`);
    }
    room.setGuest(new Player(user, deck));
    room.start();
  }
}
