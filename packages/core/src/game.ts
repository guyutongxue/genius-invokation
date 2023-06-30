
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
}

export class Game {
  constructor(private options?: Partial<GameOptions>) {
    options ??= {};
    this.options = { ...DEFAULT_GAME_OPTIONS, ...options };
  }

  registerPlayer(who: 0 | 1, playerConfig: PlayerConfig) : GameController {

  }
}
