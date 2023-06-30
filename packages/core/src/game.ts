import { Handler, StateData } from "@gi-tcg/typings";
import { GameState } from "./state.js";

export interface GameOptions {
  initialHands: number;
  maxHands: number;
  maxRounds: number;
  maxSupports: number;
  maxSummons: number;
}

const DEFAULT_GAME_OPTIONS: GameOptions = {
  initialHands: 5,
  maxHands: 10,
  maxRounds: 15,
  maxSupports: 4,
  maxSummons: 4,
};

export interface PlayerConfig {
  handler: Handler;
}

export interface GameController {
  ready(): void;
  giveUp(): void;
  preview(): StateData;
}

export class Game {
  private readonly options: GameOptions;
  private readonly players: [PlayerConfig | null, PlayerConfig | null] = [
    null,
    null,
  ];
  private state: GameState | null = null;

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
      preview: () => this.#preview(who),
    };
  }

  #ready(who: 0 | 1) {
    
  }
  #giveUp(who: 0 | 1) {
    if (this.state === null) {
      throw new Error("Game not started");
    }
    this.state.giveUp(who);
  }
  #preview(who: 0 | 1): StateData {
    if (this.state === null) {
      throw new Error("Game not started");
    }
    return this.state.preview(who);
  }
}
