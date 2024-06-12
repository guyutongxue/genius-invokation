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
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  GameConfig,
  GameStateLogEntry,
  GiTcgError,
  GiTcgIOError,
  Game as InternalGame,
  NotificationMessage,
  PlayerConfig,
  PlayerIO,
  RerollDiceResponse,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  SwitchHandsResponse,
  serializeGameStateLog,
} from "@gi-tcg/core";
import data from "@gi-tcg/data";
import { Deck, flip } from "@gi-tcg/utils";
import {
  characters as characterData,
  actionCards as actionCardData,
} from "@gi-tcg/static-data";
import { Subject } from "rxjs";
import { IsInt, IsObject } from "class-validator";

interface RoomConfig extends GameConfig {
  switchHandTime: number; // defaults 45
  rerollTime: number; // defaults 40
  roundTotalActionTime: number; // defaults 60
  actionTime: number; // defaults 25
}

interface CreateRoomConfig extends RoomConfig {
  hostWho: 0 | 1;
}

interface ManagedPlayerIO {
  notify: (notification: NotificationMessage) => void;
  rpc: (method: RpcMethod, params: RpcRequest[RpcMethod]) => Promise<any>;
  onError: (e: GiTcgError) => void;
}

export interface SSENotification {
  type: "notification";
  data: NotificationMessage;
}
export interface SSERpc {
  type: "rpc";
  id: number;
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

class Player implements PlayerIoWithError {
  public readonly sse$ = new Subject<SSEPayload>();
  constructor(
    public readonly userId: number,
    public deck: Deck,
  ) {}
  giveUp = false;

  private _nextRpcId = 0;
  private _rpcResolvers = new Map<number, (response: any) => void>();

  receiveResponse(response: GameActionResponseDto) {
    const resolver = this._rpcResolvers.get(response.id);
    if (resolver) {
      resolver(response.response);
    } else {
      throw new NotFoundException("rpc response id not found");
    }
  }
  notify(notification: NotificationMessage) {
    this.sse$.next({ type: "notification", data: notification });
  }
  async rpc(method: RpcMethod, params: RpcRequest[RpcMethod]): Promise<any> {
    const id = this._nextRpcId++;
    const payload: SSERpc = { type: "rpc", id, method, params };
    this.sse$.next(payload);
    return new Promise((resolve) => {
      this._rpcResolvers.set(id, resolve);
    });
  }
  onError(e: GiTcgError) {
    this.sse$.next({ type: "error", message: e.message });
  }
}

class DeckVerificationError extends Error {}

function verifyDeck({ characters, cards }: Deck) {
  const characterTags = [];
  for (const chId of characters) {
    const character = characterData.find((ch) => ch.id === chId);
    if (!character) {
      throw new DeckVerificationError(`character id ${chId} not found`);
    }
    if (!character.obtainable) {
      throw new DeckVerificationError(`character id ${chId} not obtainable`);
    }
    characterTags.push(...character.tags);
  }
  for (const cardId of cards) {
    const card = actionCardData.find((c) => c.id === cardId);
    if (!card) {
      throw new DeckVerificationError(`card id ${cardId} not found`);
    }
    if (!card.obtainable) {
      throw new DeckVerificationError(`card id ${cardId} not obtainable`);
    }
    if (
      card.relatedCharacterId !== null &&
      !characters.includes(card.relatedCharacterId)
    ) {
      throw new DeckVerificationError(
        `card id ${cardId} related character not in deck`,
      );
    }
    for (const requiredTag of card.relatedCharacterTags) {
      const idx = characterTags.indexOf(requiredTag);
      if (idx === -1) {
        throw new DeckVerificationError(
          `card id ${cardId} related character tags not in deck`,
        );
      }
      characterTags.splice(idx, 1);
    }
  }
}

class Room {
  private game: InternalGame | null = null;
  private hostWho: 0 | 1;
  private host: Player | null = null;
  private guest: Player | null = null;
  private stateLog: GameStateLogEntry[] = [];
  private terminated = false;

  constructor(private readonly config: CreateRoomConfig) {
    this.hostWho = config.hostWho;
  }

  private wrapRpc(rpcHandler: PlayerIO["rpc"]): PlayerIO["rpc"] {
    return (m, req) => {
      const timeoutHandler = async () => {
        if (m === "action") {
          const { candidates } = req as ActionRequest;
          const declareEndIdx = candidates.findIndex((c) => c.type === "declareEnd");
          const result: ActionResponse = {
            chosenIndex: declareEndIdx,
            cost: []
          };
          return result;
        } else if (m === "chooseActive") {
          const { candidates } = req as ChooseActiveRequest;
          const result: ChooseActiveResponse = {
            active: candidates[0]
          };
          return result;
        } else if (m === "rerollDice") {
          const result: RerollDiceResponse = {
            rerollIndexes: []
          };
          return result;
        } else if (m === "switchHands") {
          const result: SwitchHandsResponse = {
            removedHands: []
          };
          return result;
        }
      }
      return Promise.race<any>([rpcHandler(m, req), timeoutHandler()]);
    }
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
    let playerIo0: PlayerIoWithError;
    let playerIo1: PlayerIoWithError;
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
    this.game = new InternalGame({
      data,
      gameConfig: this.config,
      playerConfigs: [playerConfig0, playerConfig1],
      io: {
        pause: async (state, mut, canResume) => {
          this.stateLog.push({ state, canResume });
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
export class GamesService {
  private rooms = new Map<number, Room>();
}
