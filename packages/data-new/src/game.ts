import minstd from "@stdlib/random-base-minstd";

import { GameConfig, GameState, PlayerState } from "./base/state";
import { getCardDefinition, getCharacterDefinition } from "./registry";
import { applyMutation } from "./base/mutation";

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
  private state: GameState;

  constructor(
    private readonly config: GameConfig,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig],
  ) {
    const initRandomState = minstd.factory({
      seed: config.randomSeed,
    }).state;
    this.state = {
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

  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = getCharacterDefinition(ch);
      this.state = applyMutation(this.state, {
        type: "createCharacter",
        who,
        value: {
          definition: def,
          variables: def.constants,
          entities: [],
          defeated: false,
        },
      });
    }
    for (const card of config.cards) {
      const def = getCardDefinition(card);
      this.state = applyMutation(this.state, {
        type: "createCard",
        who,
        value: {
          definition: def,
        },
        target: "piles",
      });
    }
  }


}
