import { Event, PhaseType, StateData } from "@gi-tcg/typings";
import { GameOptions, PlayerConfig } from "./game.js";
import { Player } from "./player.js";
import type { Context } from "@gi-tcg/data";

function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

export class GameState {
  phase: PhaseType = "initHands";
  roundNumber = 0;
  currentTurn = 0;
  nextTurn = 0;
  readonly players: [Player, Player];

  constructor(
    private readonly options: GameOptions,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig]
  ) {
    this.players = [new Player(playerConfigs[0]), new Player(playerConfigs[1])];
  }

  private toStateData(who: 0 | 1): StateData {
    const playerData = this.players[who].getPlayerData();
    const oppPlayerData = this.players[flip(who)].getPlayerDataForOpp();
    return {
      phase: this.phase,
      turn: this.currentTurn,
      players: [playerData, oppPlayerData],
    };
  }

  private notifyPlayer(who: 0 | 1, event: Event) {
    this.playerConfigs[who].onNotify?.({
      event,
      state: this.toStateData(who),
    });
  }

  giveUp(who: 0 | 1) {}
  preview(who: 0 | 1, skillId: number): StateData {
    throw new Error("Not implemented");
  }
}

class ContextImpl implements Context {}
