import {
  DamageData,
  DamageType,
  Event,
  NotificationMessage,
  PhaseType,
  StateData,
  verifyNotificationMessage,
} from "@gi-tcg/typings";

import { GameOptions, PlayerConfig } from "./game.js";
import { Player } from "./player.js";
import { shallowClone } from "./entity.js";
import {
  EventFactory,
  SkillContextImpl,
  StatusContextImpl,
  SummonContextImpl,
  TrivialEvent,
  createCommonEventContext,
  getContextById,
} from "./context.js";
import { Character } from "./character.js";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

export interface GlobalOperations {
  triggerHandlingEvent: (...event: unknown[]) => void;
  notifyMe: (event: Event) => void;
  notifyOpp: (event: Event) => void;
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
      this.createOperationsForPlayer(who)
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
    await this.sendEvent("onBattleBegin");
    this.phase = "roll";
  }
  private async rollPhase() {
    await Promise.all([
      this.players[0].rollDice(),
      this.players[1].rollDice(),
    ]);
    this.phase = "action";
  }
  private async actionPhase() {
    await this.sendEvent("onActionPhase");
    // for each turn, handle "onBeforeAction"
    // TODO "onBeforeUseDice"
    // TODO "onRequestFastSwitchActive"
    // after action, handle "onAction"
    // ... / "onSwitchActive" / "onUseSkill" / "onPlayCard" / "onDeclareEnd"
    // 上方的三个可见操作，应当在对应的 player 函数内触发
    this.phase = "end";
  }
  private async endPhase() {
    await this.sendEvent("onEndPhase");
    this.phase = "gameEnd";
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

  async sendEvent(event: TrivialEvent | EventFactory) {
    if (typeof event === "string") {
      event = createCommonEventContext(this, event);
    } 
    for await (const r of this.handleEvent(event)) {
    }
  }

  async *handleEvent(event: EventFactory) {
    for await (const r of this.players[this.currentTurn].handleEvent(event)) {
      yield;
    }
    for await (const r of this.players[flip(this.currentTurn)].handleEvent(event)) {
      yield;
    }
  }

  private createOperationsForPlayer(who: 0 | 1): GlobalOperations {
    return {
      notifyMe: (event: Event) => this.notifyPlayer(who, event),
      notifyOpp: (event: Event) => this.notifyPlayer(flip(who), event),
      triggerHandlingEvent: (...event: unknown[]) => {
        this.eventWaitingForHandle.push(...event);
      }
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
  private eventWaitingForHandle: unknown[] = [];
  dealDamage(
    sourceId: number,
    target: Character,
    value: number,
    type: DamageType
  ) {
    const sourceCtx = getContextById(this, sourceId);
    // TODO create context for onBefore stuff
    // handle "onEarlyBeforeDealDamage"
    // handle "onBeforeDealDamage"
    if (sourceCtx instanceof SkillContextImpl) {
      // handle "onBeforeSkillDamage"
    }
    // handle target's "onBeforeDamage"
    target.health -= value;
    if (target.health < 0) {
      target.health = 0;
    }
    // TODO Elemental Reaction
    this.damageLogs.push({
      target: target.entityId,
      value,
      type,
      log: [], // TODO
    });
  }
  addHealLog(target: Character, value: number, sourceId: number) {
    this.damageLogs.push({
      target: target.entityId,
      value,
      type: DamageType.Heal,
      log: [
        {
          source: sourceId,
          what: `Heal ${value} HP`,
        },
      ],
    });
  }

  clone() {
    const clone = shallowClone(this);
    clone.players = [this.players[0].clone(), this.players[1].clone()];
    clone.eventWaitingForHandle = [...this.eventWaitingForHandle];
    clone.damageLogs = [...this.damageLogs];
    return clone;
  }
}
