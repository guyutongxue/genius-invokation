import { GameConfig, GameState, PlayerState } from "./base/state";
import randomIter from "@stdlib/random-iter-minstd";
import { getCardDefinition, getCharacterDefinition } from "./registry";

interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

export interface GlobalOps {
  nextId(): number;
  random(): number;
  switchCards(oldState: GameState, who: 0 | 1): Promise<GameState>;
  reroll(oldState: GameState, who: 0 | 1, times: number): Promise<GameState>;
  useSkill(
    oldState: GameState,
    who: 0 | 1,
    skillId: number,
  ): Promise<GameState>;
}

class Game implements GlobalOps {
  private readonly state: GameState;

  private _nextId = -500000;
  private _random: Iterator<number, number>;
  nextId(): number {
    return this._nextId--;
  }
  random(): number {
    return this._random.next().value;
  }

  private initPlayerState(config: PlayerConfig): PlayerState {
    return {
      activeCharacterId: 0,
      characters: config.characters.map((c) => {
        const def = getCharacterDefinition(c);
        return {
          id: this.nextId(),
          definition: def,
          entities: [],
          variables: def.constants,
          defeated: false,
        };
      }),
      piles: config.cards.map((c) => {
        const def = getCardDefinition(c);
        return {
          id: this.nextId(),
          definition: def,
        };
      }),
      hands: [],
      dice: [],
      combatStatuses: [],
      summons: [],
      supports: [],
      declaredEnd: false,
      legendUsed: false,
      skipNextTurn: false,
    };
  }

  constructor(
    private readonly config: GameConfig,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig],
  ) {
    this._random = randomIter({
      seed: this.config.randomSeed,
      normalized: true,
    }) as Iterator<number, number>;
    this.state = {
      config,
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 1,
      skillLog: [],
      mutationLog: [],
      winner: null,
      players: [
        this.initPlayerState(playerConfigs[0]),
        this.initPlayerState(playerConfigs[1]),
      ],
    };
  }

  async switchCards(oldState: GameState, who: 0 | 1): Promise<GameState> {
    // TODO
    return oldState;
  }
  async reroll(oldState: GameState, who: 0 | 1, times: number): Promise<GameState> {
    // TODO
    return oldState;
  }
  async useSkill(
    oldState: GameState,
    who: 0 | 1,
    skillId: number,
  ): Promise<GameState> {
    // TODO
    return oldState;
  }
}

export {};
