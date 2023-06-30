import { Event, PhaseType, StateData } from "@gi-tcg/typings";
import type { Context } from "@gi-tcg/data";

import { GameOptions, PlayerConfig } from "./game.js";
import { Player } from "./player.js";
import { shallowClone } from "./entity.js";

function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

export interface Notifier {
  me: (event: Event) => void;
  opp: (event: Event) => void;
}

export class GameState {
  private phase: PhaseType = "initHands";
  private roundNumber = 0;
  private currentTurn = 0;
  private nextTurn = 0;
  private players: [Player, Player];

  constructor(
    private readonly options: GameOptions,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig]
  ) {
    this.players = [
      new Player(playerConfigs[0], this.createNotifier(0)), 
      new Player(playerConfigs[1], this.createNotifier(1)),
    ];
  }

  private getData(who: 0 | 1): StateData {
    const playerData = this.players[who].getData();
    const oppPlayerData = this.players[flip(who)].getDataForOpp();
    return {
      phase: this.phase,
      turn: this.currentTurn,
      players: [playerData, oppPlayerData],
    };
  }

  private notifyPlayer(who: 0 | 1, event: Event) {
    this.playerConfigs[who].onNotify?.({
      event,
      state: this.getData(who),
    });
  }

  private createNotifier(who: 0 | 1) {
    return {
      me: (event: Event) => this.notifyPlayer(who, event),
      opp: (event: Event) => this.notifyPlayer(flip(who), event),
    }
  }

  giveUp(who: 0 | 1) {}
  preview(who: 0 | 1, skillId: number): StateData {
    throw new Error("Not implemented");
  }

  clone() {
    const clone = shallowClone(this);
    clone.players = [this.players[0].clone(), this.players[1].clone()];
    return clone;
  }
}

class ContextImpl implements Context {}
