import { GameOptions, Player } from ".";
import { CharacterFacade, DiceType, StateFacade, StatusFacade, SummonFacade, SupportFacade } from "@jenshin-tcg/typings";
import { initCharacter, requestPlayer } from "./operations";
import * as _ from "lodash-es";

export type Pair<T> = [T, T];

export interface CoinTossState {
  type: "coinToss";
}

export interface WithPlayersState {
  players: Pair<any>;
  piles: Pair<number[]>;
  hands: Pair<number[]>;
  characters: Pair<CharacterFacade[]>;
  nextTurn: 0 | 1;
  combatStatuses: Pair<StatusFacade[]>;
  supports: Pair<SupportFacade[]>;
  summons: Pair<SummonFacade[]>;
  globalEffects: Pair<any[]>; // TODO
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
  dice: Pair<DiceType[]>;
}

export interface ActionPhaseState extends WithDiceState {
  type: "actionPhase";
  turn: 0 | 1;
}

export interface EndPhaseState extends WithDiceState {
  type: "endPhase";
}

export interface ForceSwitchPlayerState extends WithDiceState {
  type: "forceSwitchPlayer";
  activePlayer: 0 | 1;
  nextState: "actionPhase" | "endPhase";
}

export interface GameEndState extends WithPlayersState {
  type: "gameEnd";
  winner: 0 | 1;
  winnerActive: number;
}

export type State =
  | CoinTossState
  | InitHandsState
  | InitActiveState
  | RollPhaseState
  | ActionPhaseState
  | ForceSwitchPlayerState
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
          globalEffects: [[], []],
          nextTurn: 0,
        };
        break;
      }
      case "initHands": {
        await Promise.all([
          this.switchHands(0),
          this.switchHands(1),
        ]);
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
          winnerActive: 0,
        };
        break;
      }
      case "rollPhase": {
        break;
      }
      case "actionPhase": {
        break;
      }
      case "forceSwitchPlayer": {
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
          state: this.createFacade(i as (0 | 1))
        }
      })
    });
  }

  private async switchHands(p: 0 | 1, canRemove = true) {
    if (!("hands" in this.state)) {
      throw new Error("bad state");
    }
    const resp = await requestPlayer((p ? this.p1 : this.p0), "switchHands", {
      hands: this.state.hands[p],
      canRemove
    });
    if (canRemove) {
      const back = _.pullAt(this.state.hands[p], resp.removedHands);
      this.state.piles[p] = _.shuffle([...this.state.piles[p], ...back]);
      const news = this.state.piles[p].splice(0, back.length);
      this.state.hands[p].push(...news);
      // notify other one
      requestPlayer((p? this.p0 : this.p1), "eventArrived", {
        event: {
          type: "peerSwitchHands",
          removeNum: back.length,
          addNum: news.length,
        }
      })
    }
  }

  private createFacade(p: 0 | 1): StateFacade {
    if (!("hands" in this.state)) {
      throw new Error("bad state");
    }
    return {
      pileNumber: this.state.piles[p].length,
      hands: this.state.hands[p].map(id => ({ id })),
      active: "actives" in this.state ? this.state.actives[p] : undefined,
      characters: this.state.characters[p],
      combatStatuses: this.state.combatStatuses[p],
      supports: this.state.supports[p],
      summons: this.state.summons[p],
      dice: "dice" in this.state ? this.state.dice[p] : [],
      globalEffects: this.state.globalEffects[p],
      peerPileNumber: this.state.piles[1 - p].length,
      peerHandsNumber: this.state.hands[1 - p].length,
      peerActive: "actives" in this.state ? this.state.actives[1 - p] : undefined,
      peerCharacters: this.state.characters[1 - p],
      peerCombatStatuses: this.state.combatStatuses[1 - p],
      peerSupports: this.state.supports[1 - p],
      peerSummons: this.state.summons[1 - p],
      peerDiceNumber: "dice" in this.state ? this.state.dice[1 - p].length : 0,
    }
  }

  public async run(): Promise<GameEndState> {
    while (this.state.type !== "gameEnd") {
      await this.next();
    }
    return this.state;
  }
}
