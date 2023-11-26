import minstd from "@stdlib/random-base-minstd";

import { GameConfig, GameState, PlayerState } from "./base/state";
import { getCardDefinition, getCharacterDefinition } from "./registry";
import { Mutation, applyMutation } from "./base/mutation";
import { GameIO, exposeMutation, exposeState } from "./io";
import { Event } from "@gi-tcg/typings";

export interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

const INITIAL_ID = -500000;
const INITIAL_PLAYER_STATE: PlayerState = {
  activeCharacterId: 0,
  characters: [],
  piles: [],
  // config.cards.map((c) => {
  //   const def = getCardDefinition(c);
  //   return {
  //     id: this.nextId(),
  //     definition: def,
  //   };
  // }),
  hands: [],
  dice: [],
  combatStatuses: [],
  summons: [],
  supports: [],
  declaredEnd: false,
  canPlunging: false,
  hasDefeated: false,
  legendUsed: false,
  skipNextTurn: false,
};

class Game {
  private _state: GameState;
  get state() {
    return this._state;
  }

  constructor(
    private readonly config: GameConfig,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig],
    private readonly io: GameIO,
  ) {
    const initRandomState = minstd.factory({
      seed: config.randomSeed,
    }).state;
    this._state = {
      config,
      iterators: {
        random: initRandomState,
        id: INITIAL_ID,
      },
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 1,
      skillLog: [],
      mutationLog: [],
      winner: null,
      players: [INITIAL_PLAYER_STATE, INITIAL_PLAYER_STATE],
    };
    this.initPlayerCards(0);
    this.initPlayerCards(1);
  }

  private mutate(mutation: Mutation) {
    this._state = applyMutation(this._state, mutation);
  }

  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = getCharacterDefinition(ch);
      this.mutate({
        type: "createCharacter",
        who,
        value: {
          id: 0,
          definition: def,
          variables: def.constants,
          entities: [],
        },
      });
    }
    for (const card of config.cards) {
      const def = getCardDefinition(card);
      this.mutate({
        type: "createCard",
        who,
        value: {
          id: 0,
          definition: def,
        },
        target: "piles",
      });
    }
  }

  private notify(events: Event[]) {
    for (const i of [0, 1] as const) {
      const player = this.io.players[i];
      player.notify({
        events,
        mutations: this.state.mutationLog
          .flatMap((m) => {
            const ex = exposeMutation(i, m.mutation);
            return ex ? [ex] : [];
          }),
        newState: exposeState(i, this.state),
      });
    }
  }

  async start() {
    await this.io.pause(this._state);
    this.notify([]);
  }
}

export interface StartOption {
  gameConfig?: GameConfig;
  playerConfigs: [PlayerConfig, PlayerConfig];
  io: GameIO;
}

export async function startGame(opt: StartOption): Promise<0 | 1 | null> {
  const game = new Game(
    opt.gameConfig ?? {
      initialDice: 8,
      initialHands: 5,
      maxDice: 16,
      maxHands: 10,
      maxRounds: 15,
      maxSummons: 4,
      maxSupports: 4,
      randomSeed: Math.floor(Math.random() * 21474836) + 1,
    },
    opt.playerConfigs,
    opt.io,
  );
  await game.start();
  return game.state.winner;
}
