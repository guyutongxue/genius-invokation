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

import "core-js/es/promise/with-resolvers";
import "core-js/proposals/iterator-helpers";
import "core-js/proposals/explicit-resource-management";

import getData from "@gi-tcg/data";
import {
  RpcRequest,
  RpcResponse,
  Notification,
  PbPhaseType,
} from "@gi-tcg/typings";
import {
  executeQueryOnState,
  GiTcgIoError,
  Game as InternalGame,
  VERSIONS,
  type AnyState,
  type CreateInitialStateConfig,
  type DeckConfig,
  type GameState,
  type Mutation,
  type Version,
} from "@gi-tcg/core";
import * as c from "./constant";
import { io } from "@gi-tcg/cbinding-io";

class GameCreateParameter {
  config: Omit<CreateInitialStateConfig, "decks" | "data"> = {};
  decks: [DeckConfig, DeckConfig] = [
    {
      characters: [],
      cards: [],
    },
    {
      characters: [],
      cards: [],
    },
  ];
  dataVersion: Version | undefined = void 0;

  #assertNumber(value: unknown): asserts value is number {
    if (typeof value !== "number") {
      throw new Error(`Invalid value: ${value}`);
    }
  }

  setDeckCharacters(who: 0 | 1, characters: number[]) {
    this.decks[who].characters = characters;
  }
  setDeckCards(who: 0 | 1, cards: number[]) {
    this.decks[who].cards = cards;
  }

  setAttribute(attribute: number, value: string | number) {
    switch (attribute) {
      case c.GITCG_ATTR_CREATEPARAM_DATA_VERSION: {
        if (VERSIONS.includes(value as any)) {
          this.dataVersion = value as Version;
        } else {
          throw new Error(`Invalid data version: ${value}`);
        }
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_RANDOM_SEED: {
        this.#assertNumber(value);
        this.config.randomSeed = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_INITIAL_HANDS_COUNT: {
        this.#assertNumber(value);
        this.config.initialHandsCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_MAX_HANDS_COUNT: {
        this.#assertNumber(value);
        this.config.maxHandsCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_MAX_ROUNDS_COUNT: {
        this.#assertNumber(value);
        this.config.maxRoundsCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_MAX_SUPPORTS_COUNT: {
        this.#assertNumber(value);
        this.config.maxSupportsCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_MAX_SUMMONS_COUNT: {
        this.#assertNumber(value);
        this.config.maxSummonsCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_INITIAL_DICE_COUNT: {
        this.#assertNumber(value);
        this.config.initialDiceCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_MAX_DICE_COUNT: {
        this.#assertNumber(value);
        this.config.maxDiceCount = value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_NO_SHUFFLE_0: {
        this.#assertNumber(value);
        this.decks[0].noShuffle = !!value;
        break;
      }
      case c.GITCG_ATTR_CREATEPARAM_NO_SHUFFLE_1: {
        this.#assertNumber(value);
        this.decks[1].noShuffle = !!value;
        break;
      }
      default: {
        throw new Error(`Invalid attribute: ${attribute}`);
      }
    }
  }

  createInitialState(): GameState {
    if (this.decks[0].characters.length === 0) {
      throw new Error("Deck 0 has no characters");
    }
    if (this.decks[1].characters.length === 0) {
      throw new Error("Deck 1 has no characters");
    }
    return InternalGame.createInitialState({
      ...this.config,
      data: getData(this.dataVersion),
      decks: this.decks,
    });
  }
}

export class Game {
  static createParameter() {
    return new GameCreateParameter();
  }
  #game: InternalGame;
  readonly id: number;

  constructor(id: number, state: GameState) {
    this.id = id;
    this.#game = new InternalGame(state);
    this.#game.onPause = (st, m, r) => this.#onPause(st, m, r);
    this.#game.onIoError = (e) => this.#onIoError(e);
    this.#game.players[0].io.notify = (data) => this.#notify(0, data);
    this.#game.players[1].io.notify = (data) => this.#notify(1, data);
    this.#game.players[0].io.rpc = (data) => this.#rpc(0, data);
    this.#game.players[1].io.rpc = (data) => this.#rpc(1, data);
  }

  #notify(who: 0 | 1, data: Notification) {
    io(
      this.id,
      c.GITCG_INTERNAL_IO_NOTIFICATION,
      who,
      Notification.encode(data).finish(),
    );
  }
  async #rpc(who: 0 | 1, data: RpcRequest): Promise<RpcResponse> {
    const response = io(
      this.id,
      c.GITCG_INTERNAL_IO_RPC,
      who,
      RpcRequest.encode(data).finish(),
    );
    return RpcResponse.decode(response);
  }

  // step is awaiting on this promise
  #stepResolvers = Promise.withResolvers();
  // pause is awaiting on this promise
  #stepDoneResolvers = Promise.withResolvers();

  #mutations: Mutation[] = [];
  async #onPause(state: GameState, mutations: Mutation[], resumable: boolean) {
    this.#mutations = mutations;
    this.#resumable = resumable;
    this.#stepDoneResolvers = Promise.withResolvers();
    this.#stepResolvers.resolve();
    await this.#stepDoneResolvers.promise;
  }
  async #onIoError(e: GiTcgIoError) {
    io(this.id, c.GITCG_INTERNAL_IO_ERROR, 0, e.message);
  }

  #status = c.GITCG_GAME_STATUS_NOT_STARTED;
  #resumable = false;
  get state() {
    return this.#game.state;
  }
  get status() {
    return this.#status;
  }
  get resumable() {
    return this.#resumable;
  }
  get lastMutations() {
    return this.#mutations;
  }

  async step(): Promise<void> {
    switch (this.#status) {
      case c.GITCG_GAME_STATUS_NOT_STARTED: {
        this.#status = c.GITCG_GAME_STATUS_RUNNING;
        this.#game
          .start()
          .then((e) => {
            this.#status = c.GITCG_GAME_STATUS_FINISHED;
            this.#stepResolvers.resolve();
          })
          .catch((e) => {
            this.#status = c.GITCG_GAME_STATUS_ABORTED;
            this.#stepResolvers.reject(e);
          });
      }
      case c.GITCG_GAME_STATUS_RUNNING: {
        this.#stepResolvers = Promise.withResolvers();
        this.#stepDoneResolvers.resolve();
        await this.#stepResolvers.promise;
      }
      case c.GITCG_GAME_STATUS_RUNNING: {
        return;
      }
      case c.GITCG_GAME_STATUS_ABORTED: {
        throw new Error("Game got aborted, cannot step");
      }
    }
  }

  static queryState(state: GameState, who: 0 | 1, query: string): AnyState[] {
    return executeQueryOnState(state, who, query);
  }
  static getStateAttribute(state: GameState, attribute: number): number {
    switch (attribute) {
      case c.GITCG_ATTR_STATE_PHASE: {
        switch (state.phase) {
          case "initActives":
            return PbPhaseType.PHASE_INIT_ACTIVES;
          case "initHands":
            return PbPhaseType.PHASE_INIT_HANDS;
          case "roll":
            return PbPhaseType.PHASE_ROLL;
          case "action":
            return PbPhaseType.PHASE_ACTION;
          case "end":
            return PbPhaseType.PHASE_END;
          case "gameEnd":
            return PbPhaseType.PHASE_GAME_END;
          default:
            return -1;
        }
      }
      case c.GITCG_ATTR_STATE_ROUND_NUMBER: {
        return state.roundNumber;
      }
      case c.GITCG_ATTR_STATE_CURRENT_TURN: {
        return state.currentTurn;
      }
      case c.GITCG_ATTR_STATE_WINNER: {
        return state.winner ?? -1;
      }
      case c.GITCG_ATTR_STATE_PLAYER_DECLARED_END_0: {
        return +state.players[0].declaredEnd;
      }
      case c.GITCG_ATTR_STATE_PLAYER_DECLARED_END_1: {
        return +state.players[1].declaredEnd;
      }
      case c.GITCG_ATTR_STATE_PLAYER_HAS_DEFEATED_0: {
        return +state.players[0].hasDefeated;
      }
      case c.GITCG_ATTR_STATE_PLAYER_HAS_DEFEATED_1: {
        return +state.players[1].hasDefeated;
      }
      case c.GITCG_ATTR_STATE_PLAYER_CAN_CHARGED_0: {
        return +state.players[0].canCharged;
      }
      case c.GITCG_ATTR_STATE_PLAYER_CAN_CHARGED_1: {
        return +state.players[1].canCharged;
      }
      case c.GITCG_ATTR_STATE_PLAYER_CAN_PLUNGING_0: {
        return +state.players[0].canPlunging;
      }
      case c.GITCG_ATTR_STATE_PLAYER_CAN_PLUNGING_1: {
        return +state.players[1].canPlunging;
      }
      case c.GITCG_ATTR_STATE_PLAYER_LEGEND_USED_0: {
        return +state.players[0].legendUsed;
      }
      case c.GITCG_ATTR_STATE_PLAYER_LEGEND_USED_1: {
        return +state.players[1].legendUsed;
      }
      case c.GITCG_ATTR_STATE_PLAYER_SKIP_NEXT_TURN_0: {
        return +state.players[0].skipNextTurn;
      }
      case c.GITCG_ATTR_STATE_PLAYER_SKIP_NEXT_TURN_1: {
        return +state.players[1].skipNextTurn;
      }
      default: {
        throw new Error(`Invalid attribute: ${attribute}`);
      }
    }
  }

  getAttribute(attribute: number): number {
    switch (attribute) {
      case c.GITCG_ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_0: {
        return +this.#game.players[0].config.allowTuningAnyDice;
      }
      case c.GITCG_ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_1: {
        return +this.#game.players[1].config.allowTuningAnyDice;
      }
      case c.GITCG_ATTR_PLAYER_ALWAYS_OMNI_0: {
        return +this.#game.players[0].config.alwaysOmni;
      }
      case c.GITCG_ATTR_PLAYER_ALWAYS_OMNI_1: {
        return +this.#game.players[1].config.alwaysOmni;
      }
      default: {
        return Game.getStateAttribute(this.#game.state, attribute);
      }
    }
  }
  setAttribute(attribute: number, value: number) {
    switch (attribute) {
      case c.GITCG_ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_0: {
        this.#game.players[0].config.allowTuningAnyDice = !!value;
        break;
      }
      case c.GITCG_ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_1: {
        this.#game.players[1].config.allowTuningAnyDice = !!value;
        break;
      }
      case c.GITCG_ATTR_PLAYER_ALWAYS_OMNI_0: {
        this.#game.players[0].config.alwaysOmni = !!value;
        break;
      }
      case c.GITCG_ATTR_PLAYER_ALWAYS_OMNI_1: {
        this.#game.players[1].config.alwaysOmni = !!value;
        break;
      }
      default: {
        throw new Error(`Invalid attribute: ${attribute}`);
      }
    }
  }
}
