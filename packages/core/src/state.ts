import {
  DamageData,
  Event,
  GamePhaseEvent,
  NotificationMessage,
  PhaseType,
  StateData,
  verifyNotificationMessage,
} from "@gi-tcg/typings";
import { Context, ContextOfEvent, EventHandlers } from "@gi-tcg/data";

import { GameOptions, PlayerConfig } from "./game.js";
import { Player } from "./player.js";
import { shallowClone } from "./entity.js";
import { ContextFactory } from "./context.js";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

export interface Notifier {
  me: (event: Event) => void;
  opp: (event: Event) => void;
}

export class GameState {
  private phase: PhaseType = "initHands";
  private roundNumber = 0;
  private currentTurn: 0 | 1 = 0;
  public nextTurn: 0 | 1 = 0;
  private winner: 0 | 1 | null = null;
  private players: [Player, Player];

  constructor(
    private readonly options: GameOptions,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig]
  ) {
    this.players = [this.createPlayer(0), this.createPlayer(1)];
    this.start();
  }

  public getPhase() {
    return this.phase;
  }
  public getRoundNumber() {
    return this.roundNumber;
  }
  public getCurrentTurn() {
    return this.currentTurn;
  }
  public getPlayer(who: 0 | 1) {
    return this.players[who];
  }

  private createPlayer(who: 0 | 1) {
    return new Player(
      {
        ...this.playerConfigs[who],
        game: this.options,
      },
      this.createNotifier(who)
    );
  }

  private async start() {
    while (this.phase !== "gameEnd") {
      await this.step();
    }
    this.notifyPlayer(0, {
      type: "gameEnd",
      win: this.winner === null ? undefined : this.winner === 0,
    });
    this.notifyPlayer(1, {
      type: "gameEnd",
      win: this.winner === null ? undefined : this.winner === 1,
    });
  }

  private async step() {
    this.notifyPlayer(0, {
      type: "newGamePhase",
      roundNumber: this.roundNumber,
      isFirst: this.nextTurn === 0,
    });
    this.notifyPlayer(1, {
      type: "newGamePhase",
      roundNumber: this.roundNumber,
      isFirst: this.nextTurn === 1,
    });
    switch (this.phase) {
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
    }
    await this.options.pauser();
  }
  private async initHands() {
    this.players[0].initHands();
    this.players[1].initHands();
    await Promise.all([
      this.players[0].switchHands(),
      this.players[1].switchHands(),
    ]);
    this.phase = "initActives";
  }
  private async initActives() {
    const [n0, n1] = await Promise.all([
      this.players[0].chooseActive(true),
      this.players[1].chooseActive(true),
    ]);
    n0();
    n1();
    this.phase = "roll";
  }
  private async rollPhase() {

    this.phase = "gameEnd"
  }
  private async actionPhase() {}
  private async endPhase() {
    this.roundNumber++;
    if (this.roundNumber > this.options.maxRounds) {
      this.phase = "gameEnd";
    } else {
      this.phase = "roll";
    }
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

  handleEvent<E extends keyof EventHandlers>(
    event: E,
    cf: ContextFactory<ContextOfEvent<E>>
  ) {
    this.players[this.currentTurn].handleEvent(event, cf);
    this.players[flip(this.currentTurn)].handleEvent(event, cf);
  }

  private createNotifier(who: 0 | 1) {
    return {
      me: (event: Event) => this.notifyPlayer(who, event),
      opp: (event: Event) => this.notifyPlayer(flip(who), event),
    };
  }
  private notifyPlayer(who: 0 | 1, event: Event) {
    const msg: NotificationMessage = {
      event,
      state: this.getData(who),
    };
    verifyNotificationMessage(msg);
    this.playerConfigs[who].onNotify?.(msg);
  }

  giveUp(who: 0 | 1) {}
  preview(who: 0 | 1, skillId: number): StateData {
    throw new Error("Not implemented");
  }

  private damageLogs: DamageData[] = [];
  addDamageLog(damage: DamageData) {
    this.damageLogs.push(damage);
  }

  clone() {
    const clone = shallowClone(this);
    clone.players = [this.players[0].clone(), this.players[1].clone()];
    return clone;
  }
}
