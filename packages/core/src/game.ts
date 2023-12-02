import minstd from "@stdlib/random-base-minstd";

import {
  CharacterState,
  GameConfig,
  GameState,
  PlayerState,
} from "./base/state";
import { Mutation, StepRandomM, applyMutation } from "./base/mutation";
import { GameIO, exposeMutation, exposeState } from "./io";
import {
  DiceType,
  Event,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  verifyRpcRequest,
  verifyRpcResponse,
} from "@gi-tcg/typings";
import { getActiveCharacterIndex, getEntityById, sortDice } from "./util";
import { ReadonlyDataStore } from "./builder/registry";

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
    private readonly data: ReadonlyDataStore,
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

  private randomDice(count: number, who: 0 | 1): DiceType[] {
    const mut: StepRandomM = {
      type: "stepRandom",
      value: 0,
    };
    const result: DiceType[] = [];
    for (let i = 0; i < count; i++) {
      this.mutate(mut);
      result.push(mut.value % 8 + 1);
    }
    return sortDice(this._state.players[who], result);
  }

  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = this.data.character.get(ch);
      if (typeof def === "undefined") {
        throw new Error(`Unknown character id ${ch}`);
      }
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
      const def = this.data.card.get(card);
      if (typeof def === "undefined") {
        throw new Error(`Unknown card id ${card}`);
      }
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
        mutations: this.state.mutationLog.flatMap((m) => {
          const ex = exposeMutation(i, m.mutation);
          return ex ? [ex] : [];
        }),
        newState: exposeState(i, this.state),
      });
    }
    this.mutate({ type: "clearMutationLog" });
  }

  async start() {
    this.notify([]);
    while (this._state.phase !== "gameEnd") {
      await this.io.pause(this._state);
      switch (this._state.phase) {
        case "initHands":
          await this.initHands();
          break;
        case "initActives":
          await this.initActives();
          break;
        case "roll":
          await this.rollPhase();
          break;
        case "action":
          await this.actionPhase();
          break;
        case "end":
          await this.endPhase();
          break;
        default:
          const _check: never = this._state.phase;
          break;
      }
      if (this._state.mutationLog.length > 1) {
        this.notify([]);
      }
    }
  }

  private async rpc<M extends RpcMethod>(
    who: 0 | 1,
    method: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[M]> {
    verifyRpcRequest(method, req);
    const resp = await this.io.players[who].rpc(method, req);
    verifyRpcResponse(method, resp);
    return resp;
  }

  private async initHands() {
    this.mutate({
      type: "changePhase",
      newPhase: "initActives",
    });
  }

  private async initActives() {
    const [a0, a1] = await Promise.all(
      ([0, 1] as const).map(async (i) => {
        const player = this.state.players[i];
        const { active } = await this.rpc(i, "chooseActive", {
          candidates: player.characters.map((c) => c.id),
        });
        return getEntityById(this._state, active, true) as CharacterState;
      }),
    );
    this.mutate({
      type: "switchActive",
      who: 0,
      value: a0,
    });
    this.mutate({
      type: "switchActive",
      who: 1,
      value: a1,
    });
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
  }

  private async rollPhase() {
    const [r0, r1] = await Promise.all(
      ([0, 1] as const).map(async (i) => {
        const player = this.state.players[i];
        const controlled: DiceType[] = [];
        // TODO onRoll event
        let randomDice = this.randomDice(this.config.initialDice, i);
        let rollCount = 2;
        for (let j = 1; j < rollCount; j++) {
          const { rerollIndexes } = await this.rpc(i, "rerollDice", {
            dice: randomDice,
          });
          if (rerollIndexes.length === 0) {
            break;
          }
          for (let k = 0; k < randomDice.length; k++) {
            if (!rerollIndexes.includes(k)) {
              controlled.push(randomDice[k]);
            }
          }
          randomDice = this.randomDice(rerollIndexes.length, i);
        }
        controlled.push(...randomDice);
        return controlled;
      }),
    );
    this.mutate({
      type: "resetDice",
      who: 0,
      value: r0,
    });
    this.mutate({
      type: "resetDice",
      who: 1,
      value: r1,
    });
    this.mutate({
      type: "changePhase",
      newPhase: "action",
    });
  }
  private async actionPhase() {
    const player = this._state.players[this._state.currentTurn];
    if (player.declaredEnd) {
      // skip
    } else if (player.skipNextTurn) {
      this.mutate({
        type: "setPlayerFlag",
        who: this._state.currentTurn,
        flagName: "skipNextTurn",
        value: false,
      });
    } else {
      const activeCh = player.characters[getActiveCharacterIndex(player)];
      const skill = activeCh.definition.initiativeSkills[0];
      const [newState, eventList] = skill.action(this._state, activeCh.id);
      this._state = newState;
      this.notify([]);
      await this.io.pause(this._state);
    }
    this.mutate({
      type: "switchTurn",
    });
    if (this._state.players[0].declaredEnd && this._state.players[1].declaredEnd) {
      this.mutate({
        type: "changePhase",
        newPhase: "end",
      });
    }
  }
  private async endPhase() {
    this.mutate({
      type: "changePhase",
      newPhase: "gameEnd",
    });
  }
}

export interface StartOption {
  data: ReadonlyDataStore;
  gameConfig?: GameConfig;
  playerConfigs: [PlayerConfig, PlayerConfig];
  io: GameIO;
}

export async function startGame(opt: StartOption): Promise<0 | 1 | null> {
  const game = new Game(
    opt.data,
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
