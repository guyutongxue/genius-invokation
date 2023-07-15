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
  CONTEXT_CREATOR,
  getContextById,
  EventCreatorArgs,
  EventCreatorArgsForPlayer,
  EventHandlerNames1,
  PlayCardContextImpl,
} from "./context.js";
import { Character } from "./character.js";
import { PlayCardConfig, PlayCardTargetObj } from "./action.js";
import { CardTargetDescriptor, SpecialBits } from "@gi-tcg/data";
import { flip } from "@gi-tcg/utils";

export interface GlobalOperations {
  notifyMe: (event: Event) => void;
  notifyOpp: (event: Event) => void;
  getCardActions: () => PlayCardConfig[];
  sendEvent: <K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgsForPlayer<K>
  ) => Promise<void>;
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
    await this.sendEvent("onBattleBegin", undefined);
    this.phase = "roll";
  }
  private async rollPhase() {
    await Promise.all([this.players[0].rollDice(), this.players[1].rollDice()]);
    this.players[0].cleanSpecialBits(
      SpecialBits.DeclaredEnd,
      SpecialBits.Defeated,
      SpecialBits.Plunging
    );
    this.players[1].cleanSpecialBits(
      SpecialBits.DeclaredEnd,
      SpecialBits.Defeated,
      SpecialBits.Plunging
    );
    this.phase = "action";
  }
  private async actionPhase() {
    if (this.players[this.currentTurn].getSpecialBit(SpecialBits.DeclaredEnd)) {
      this.currentTurn = flip(this.currentTurn);
    }
    await this.sendEvent("onActionPhase", undefined);
    const action = await this.players[this.currentTurn].action();
    if (!action) {
      // 宣布结束 || 元素调和
      if (
        this.players[0].getSpecialBit(SpecialBits.DeclaredEnd) &&
        this.players[1].getSpecialBit(SpecialBits.DeclaredEnd)
      ) {
        this.phase = "end";
      }
      return;
    }
    if (
      action.type === "useSkill" ||
      (action.type === "playCard" &&
        action.card.info.tags.includes("action")) ||
      (action.type === "switchActive" && !action.fast)
    ) {
      this.currentTurn = flip(this.currentTurn);
    }
    // for each turn, handle "onBeforeAction"
    // TODO "onBeforeUseDice"
    // TODO "onRequestFastSwitchActive"
    // after action, handle "onAction"
    // ... / "onSwitchActive" / "onUseSkill" / "onPlayCard"
  }
  private async endPhase() {
    await this.sendEvent("onEndPhase", undefined);
    await Promise.all([
      this.players[0].drawHands(2),
      this.players[1].drawHands(2),
    ]);
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

  async sendEvent<K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgs<K>
  ) {
    const creator = CONTEXT_CREATOR[event];
    // @ts-expect-error TS SUCKS
    const e: EventFactory = creator(this, ...args);
    for await (const r of this.handleEvent(e)) {
    }
  }

  async *handleEvent(event: EventFactory) {
    for await (const r of this.players[this.currentTurn].handleEvent(event)) {
      yield;
    }
    for await (const r of this.players[flip(this.currentTurn)].handleEvent(
      event
    )) {
      yield;
    }
  }

  private createOperationsForPlayer(who: 0 | 1): GlobalOperations {
    return {
      notifyMe: (event) => this.notifyPlayer(who, event),
      notifyOpp: (event) => this.notifyPlayer(flip(who), event),
      getCardActions: () => this.getCardActions(who),
      sendEvent: (event, ...args) => {
        // @ts-expect-error TS SUCKS
        return this.sendEvent(event, who, ...args);
      },
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
  private eventWaitingForHandle: EventFactory[] = [];
  pushEvent(event: EventFactory) {
    this.eventWaitingForHandle.push(event);
  }
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
  heal(target: Character, value: number, sourceId: number) {
    const newHealth = target.health + value;
    const realHealth = Math.min(newHealth, target.info.maxHealth);
    const diff = realHealth - target.health;
    target.health = realHealth;
    this.damageLogs.push({
      target: target.entityId,
      value,
      type: DamageType.Heal,
      log: [
        {
          source: sourceId,
          what: `Heal ${value}(${diff}) HP`,
        },
      ],
    });
  }

  private getCardTarget(
    ...descriptor: CardTargetDescriptor
  ): PlayCardTargetObj[][] {
    if (descriptor.length === 0) {
      return [[]];
    }
    const [first, ...rest] = descriptor;
    let firstResult: PlayCardTargetObj[] = [];
    switch (first) {
      case "character": {
        const c0 = this.players[0].characters;
        const c1 = this.players[1].characters;
        firstResult = [...c0, ...c1];
        break;
      }
      case "summon": {
        const c0 = this.players[0].summons;
        const c1 = this.players[1].summons;
        firstResult = [...c0, ...c1];
        break;
      }
    }
    return firstResult.flatMap((c) =>
      this.getCardTarget(...rest).map((r) => [c, ...r])
    );
  }
  getCardActions(who: 0 | 1): PlayCardConfig[] {
    const player = this.players[who];
    const actions: PlayCardConfig[] = [];
    for (const hand of player.hands) {
      const targets = this.getCardTarget(...hand.info.target);
      for (const t of targets) {
        const ctx = new PlayCardContextImpl(this, who, hand, t);
        if (ctx.enabled()) {
          actions.push({
            type: "playCard",
            dice: [...hand.info.costs],
            card: hand,
            targets: t,
          });
        }
      }
    }
    return actions;
  }

  clone() {
    const clone = shallowClone(this);
    clone.players = [this.players[0].clone(), this.players[1].clone()];
    clone.eventWaitingForHandle = [...this.eventWaitingForHandle];
    clone.damageLogs = [...this.damageLogs];
    return clone;
  }
}
