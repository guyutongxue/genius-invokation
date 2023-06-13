import { GameOptions, Player } from ".";
import {
  CharacterFacade,
  DiceType,
  StateFacade,
  StatusFacade,
  SummonFacade,
  SupportFacade,
} from "@jenshin-tcg/typings";
import { initCharacter, requestPlayer } from "./operations";
import * as _ from "lodash-es";
import { Character } from "./character";

export type Pair<T> = [T, T];

export interface CoinTossState {
  type: "coinToss";
}

export interface WithPlayersState {
  players: Pair<any>;
  piles: Pair<number[]>;
  hands: Pair<number[]>;
  characters: Pair<Character[]>;
  nextTurn: 0 | 1;
  combatStatuses: Pair<StatusFacade[]>;
  supports: Pair<SupportFacade[]>;
  summons: Pair<SummonFacade[]>;
}

export interface InitHandsState extends WithPlayersState {
  type: "initHands";
}

interface WithActivesState extends WithPlayersState {
  actives: Pair<number>;
}

export interface InitActiveState extends WithPlayersState {
  type: "initActive";
}

export interface RollPhaseState extends WithActivesState {
  type: "rollPhase";
}

interface WithDiceState extends WithActivesState {
  roundNumber: number;
  dice: Pair<DiceType[]>;
}

export interface ActionPhaseState extends WithDiceState {
  type: "actionPhase";
  turn: 0 | 1;
}

export interface EndPhaseState extends WithDiceState {
  type: "endPhase";
}

export interface GameEndState extends WithPlayersState {
  type: "gameEnd";
  winner?: 0 | 1;
}

export type State =
  | CoinTossState
  | InitHandsState
  | InitActiveState
  | RollPhaseState
  | ActionPhaseState
  | EndPhaseState
  | GameEndState;

export class StateManager {
  private state: State;
  private p0: Player;
  private p1: Player;

  constructor(private options: GameOptions) {
    this.state = {
      type: "coinToss",
    };
    [this.p0, this.p1] = options.players;
  }

  private async next() {
    switch (this.state.type) {
      case "coinToss": {
        if (Math.random() < 0.5) {
          [this.p0, this.p1] = [this.p1, this.p0];
        }
        await Promise.all([
          requestPlayer(this.p0, "initialize", { first: true }),
          requestPlayer(this.p1, "initialize", { first: false }),
        ]);
        const p0 = _.shuffle(this.p0.piles);
        const p1 = _.shuffle(this.p1.piles);
        const h0 = p0.splice(0, 5);
        const h1 = p1.splice(0, 5);
        this.state = {
          type: "initHands",
          players: [this.p0.id, this.p1.id],
          characters: [
            this.p0.characters.map(initCharacter),
            this.p1.characters.map(initCharacter),
          ],
          combatStatuses: [[], []],
          piles: [p0, p1],
          hands: [h0, h1],
          summons: [[], []],
          supports: [[], []],
          nextTurn: 0,
        };
        break;
      }
      case "initHands": {
        await Promise.all([this.switchHands(0), this.switchHands(1)]);
        this.state = {
          ...this.state,
          type: "initActive",
        };
        break;
      }
      case "initActive": {
        this.state = {
          ...this.state,
          type: "gameEnd",
          winner: 0,
        };
        break;
      }
      case "rollPhase": {
        break;
      }
      case "actionPhase": {
        break;
      }
      case "endPhase": {
        break;
      }
      case "gameEnd": {
        break;
      }
    }
    this.sendUpdate();
  }

  private sendUpdate() {
    [this.p0, this.p1].forEach((p, i) => {
      requestPlayer(p, "eventArrived", {
        event: {
          type: "updateState",
          state: this.createFacade(i as 0 | 1),
        },
      });
    });
  }

  private async switchHands(p: 0 | 1, canRemove = true) {
    if (!("hands" in this.state)) {
      throw new Error("bad state");
    }
    const resp = await requestPlayer(p ? this.p1 : this.p0, "switchHands", {
      hands: this.state.hands[p],
      canRemove,
    });
    if (canRemove) {
      for (const c of resp.removedHands) {
        const i = this.state.hands[p].indexOf(c);
        if (i === -1) {
          throw new Error("bad removed hands");
        }
        this.state.hands[p].splice(i, 1);
      }
      this.state.piles[p] = _.shuffle([
        ...this.state.piles[p],
        ...resp.removedHands,
      ]);
      const news = this.state.piles[p].splice(0, resp.removedHands.length);
      this.state.hands[p].push(...news);
      // notify other one
      requestPlayer(p ? this.p0 : this.p1, "eventArrived", {
        event: {
          type: "peerSwitchHands",
          removeNum: resp.removedHands.length,
          addNum: news.length,
        },
      }).catch(console.error);
    }
  }

  private createFacade(p: 0 | 1): StateFacade {
    if (!("hands" in this.state)) {
      throw new Error("bad state");
    }
    return {
      pileNumber: this.state.piles[p].length,
      hands: this.state.hands[p],
      active: "actives" in this.state ? this.state.actives[p] : undefined,
      characters: this.state.characters[p].map((c) => c.toFacade()),
      combatStatuses: this.state.combatStatuses[p],
      supports: this.state.supports[p],
      summons: this.state.summons[p],
      dice: "dice" in this.state ? this.state.dice[p] : [],
      peerPileNumber: this.state.piles[1 - p].length,
      peerHandsNumber: this.state.hands[1 - p].length,
      peerActive:
        "actives" in this.state ? this.state.actives[1 - p] : undefined,
      peerCharacters: this.state.characters[1 - p],
      peerCombatStatuses: this.state.combatStatuses[1 - p],
      peerSupports: this.state.supports[1 - p],
      peerSummons: this.state.summons[1 - p],
      peerDiceNumber: "dice" in this.state ? this.state.dice[1 - p].length : 0,
    };
  }

  public async run(): Promise<GameEndState> {
    while (this.state.type !== "gameEnd") {
      await this.next();
    }
    return this.state;
  }
}
