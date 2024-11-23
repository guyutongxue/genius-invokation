import "core-js/es/promise/with-resolvers";
import "core-js/proposals/iterator-helpers";
import "core-js/proposals/explicit-resource-management";

import getData from "@gi-tcg/data";
import { RpcRequest, RpcResponse, Notification } from "@gi-tcg/typings";
import {
  GiTcgIoError,
  Game as InternalGame,
  VERSIONS,
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

  setInitAttribute(attribute: number, value: string | number) {
    switch (attribute) {
      case c.GITCG_ATTR_INIT_DATA_VERSION: {
        if (VERSIONS.includes(value as any)) {
          this.dataVersion = value as Version;
        } else {
          throw new Error(`Invalid data version: ${value}`);
        }
        break;
      }
      case c.GITCG_ATTR_INIT_RANDOM_SEED: {
        this.#assertNumber(value);
        this.config.randomSeed = value;
        break;
      }
      case c.GITCG_ATTR_INIT_INITIAL_HANDS_COUNT: {
        this.#assertNumber(value);
        this.config.initialHandsCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_MAX_HANDS_COUNT: {
        this.#assertNumber(value);
        this.config.maxHandsCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_MAX_ROUNDS_COUNT: {
        this.#assertNumber(value);
        this.config.maxRoundsCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_MAX_SUPPORTS_COUNT: {
        this.#assertNumber(value);
        this.config.maxSupportsCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_MAX_SUMMONS_COUNT: {
        this.#assertNumber(value);
        this.config.maxSummonsCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_INITIAL_DICE_COUNT: {
        this.#assertNumber(value);
        this.config.initialDiceCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_MAX_DICE_COUNT: {
        this.#assertNumber(value);
        this.config.maxDiceCount = value;
        break;
      }
      case c.GITCG_ATTR_INIT_NO_SHUFFLE_0: {
        this.#assertNumber(value);
        this.decks[0].noShuffle = !!value;
        break;
      }
      case c.GITCG_ATTR_INIT_NO_SHUFFLE_1: {
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

enum Status {
  NOT_STARTED = 0,
  RUNNING = 1,
  FINISHED = 2,
  ABORTED = 3,
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

  #status = Status.NOT_STARTED;
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
      case Status.NOT_STARTED: {
        this.#status = Status.RUNNING;
        this.#game
          .start()
          .then((e) => {
            this.#status = Status.FINISHED;
            this.#stepResolvers.resolve();
          })
          .catch((e) => {
            this.#status = Status.ABORTED;
            this.#stepResolvers.reject(e);
          });
      }
      case Status.RUNNING: {
        this.#stepResolvers = Promise.withResolvers();
        this.#stepDoneResolvers.resolve();
        await this.#stepResolvers.promise;
      }
      case Status.FINISHED: {
        return;
      }
      case Status.ABORTED: {
        throw new Error("Game got aborted, cannot step");
      }
    }
  }
}
