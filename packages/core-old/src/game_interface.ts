import { Handler, NotificationMessage, StateData } from "@gi-tcg/typings";
import { Game as GameInternal } from "./game.js";

export interface GameOptions {
  initialHands: number;
  maxHands: number;
  maxRounds: number;
  maxSupports: number;
  maxSummons: number;
  initialDice: number;
  maxDice: number;
  pauser: (() => Promise<void>);
}

const DEFAULT_GAME_OPTIONS: GameOptions = {
  initialHands: 5,
  maxHands: 10,
  maxRounds: 15,
  maxSupports: 4,
  maxSummons: 4,
  initialDice: 8,
  maxDice: 16,
  pauser: () => Promise.resolve(),
};

export interface PlayerConfig {
  deck: {
    characters: number[]; // should exactly 3 items
    actions: number[]; // should exactly 30 items
  };
  handler: Handler;
  onNotify?: (event: NotificationMessage) => void;
  noShuffle?: boolean; // default: false
  alwaysOmni?: boolean; // default: false
}

export interface GameController {
  ready(): void;
  giveUp(): void;
  preview(skillId: number): StateData;
}

export class Game {
  private readonly options: GameOptions;
  private readonly players: [PlayerConfig | null, PlayerConfig | null] = [
    null,
    null,
  ];
  private game: GameInternal | null = null;

  constructor(options?: Partial<GameOptions>) {
    options ??= {};
    this.options = { ...DEFAULT_GAME_OPTIONS, ...options };
  }

  registerPlayer(who: 0 | 1, playerConfig: PlayerConfig): GameController {
    if (this.players[who] !== null) {
      throw new Error(`Player ${who} already registered`);
    }
    if (who < 0 || who > 1) {
      throw new Error(`Invalid player no. ${who}`);
    }
    this.players[who] = playerConfig;
    return {
      ready: () => this.#ready(who),
      giveUp: () => this.#giveUp(who),
      preview: (skillId) => this.#preview(who, skillId),
    };
  }
  #readyCount = 0;
  #ready(who: 0 | 1) {
    this.#readyCount++;
    if (this.#readyCount === 2) {
      this.game = new GameInternal(
        this.options,
        this.players as [PlayerConfig, PlayerConfig]
      );
    }
  }
  #giveUp(who: 0 | 1) {
    if (this.game === null) {
      throw new Error("Game not started");
    }
    this.game.giveUp(who);
  }
  #preview(who: 0 | 1, skillId: number): StateData {
    if (this.game === null) {
      throw new Error("Game not started");
    }
    return this.game.preview(who, skillId);
  }

  getHistory(): never {
    throw new Error("Not implemented");
  }
}
