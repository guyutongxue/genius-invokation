import {
  DamageData,
  DamageType,
  DiceType,
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
  CONTEXT_CREATOR,
  EventCreatorArgs,
  EventCreatorArgsForPlayer,
  EventHandlerNames1,
  PlayCardContextImpl,
  getEntityById,
  DamageContextImpl,
  createSkillContext,
} from "./context.js";
import { Character } from "./character.js";
import { PlayCardConfig, PlayCardTargetObj } from "./action.js";
import { CardTargetDescriptor, SkillDescriptionContext, SpecialBits, makeReaction, makeReactionFromDamage } from "@gi-tcg/data";
import { flip } from "@gi-tcg/utils";
import { Damage } from "./damage.js";
import { Skill } from "./skill.js";

export interface GlobalOperations {
  notifyMe: (event: Event) => void;
  notifyOpp: (event: Event) => void;
  getCardActions: () => PlayCardConfig[];
  emitEvent: <K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgsForPlayer<K>
  ) => void;
  emitImmediatelyHandledEvent: <K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgsForPlayer<K>
  ) => void;
  doEvent: () => Promise<void>;
  getSkillContext: () => (sk: Skill) => SkillDescriptionContext
}

export class GameState {
  private phase: PhaseType = "initHands";
  private roundNumber = 0;
  private currentTurn: 0 | 1 = 0;
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
      isFirst: this.currentTurn === 0,
    });
    this.notifyPlayer(1, {
      type: "newGamePhase",
      roundNumber: this.roundNumber,
      isFirst: this.currentTurn === 1,
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
    this.emitEvent("onBattleBegin");
    await this.doEvent();
    this.phase = "roll";
  }
  private async rollPhase() {
    await Promise.all([this.players[0].rollDice(), this.players[1].rollDice()]);
    this.players[0].cleanSpecialBits(
      SpecialBits.DeclaredEnd,
      SpecialBits.Defeated,
      SpecialBits.Plunging,
      SpecialBits.SkipTurn
    );
    this.players[1].cleanSpecialBits(
      SpecialBits.DeclaredEnd,
      SpecialBits.Defeated,
      SpecialBits.Plunging,
      SpecialBits.SkipTurn
    );
    this.phase = "action";
  }
  private async actionPhase() {
    this.emitEvent("onActionPhase");
    await this.doEvent();
    while (
      !(
        this.players[0].getSpecialBit(SpecialBits.DeclaredEnd) &&
        this.players[1].getSpecialBit(SpecialBits.DeclaredEnd)
      )
    ) {
      let player = this.players[this.currentTurn];
      if (player.getSpecialBit(SpecialBits.DeclaredEnd)) {
        player = this.players[flip(this.currentTurn)];
      } else if (player.getSpecialBit(SpecialBits.SkipTurn)) {
        player.setSpecialBit(SpecialBits.SkipTurn, false);
        player = this.players[flip(this.currentTurn)];
      }
      const fast = await player.action();
      await this.doEvent();
      await this.options.pauser();
      if (!fast) {
        this.currentTurn = flip(this.currentTurn);
      }
    }
    this.phase = "end";
  }
  private async endPhase() {
    this.emitEvent("onEndPhase");
    await this.doEvent();
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

  emitEvent<K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgs<K>
  ) {
    const creator = CONTEXT_CREATOR[event];
    // @ts-expect-error TS SUCKS
    const e: EventFactory = creator(this, ...args);
    this.eventWaitingForHandle.push(e);
  }
  emitImmediatelyHandledEvent<K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgs<K>
  ) {
    const creator = CONTEXT_CREATOR[event];
    // @ts-expect-error TS SUCKS
    const e: EventFactory = creator(this, ...args);
    this.handleEventSync(e);
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
  handleEventSync(event: EventFactory) {
    this.players[this.currentTurn].handleEventSync(event);
    this.players[flip(this.currentTurn)].handleEventSync(event);
  }

  private createOperationsForPlayer(who: 0 | 1): GlobalOperations {
    return {
      notifyMe: (event) => this.notifyPlayer(who, event),
      notifyOpp: (event) => this.notifyPlayer(flip(who), event),
      getCardActions: () => this.getCardActions(who),
      emitEvent: (event, ...args) => {
        // @ts-expect-error TS SUCKS
        return this.emitEvent(event, who, ...args);
      },
      emitImmediatelyHandledEvent: (event, ...args) => {
        // @ts-expect-error TS SUCKS
        return this.emitImmediatelyHandledEvent(event, who, ...args);
      },
      doEvent: () => this.doEvent(),
      getSkillContext: () => createSkillContext(this, who)
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
    const { who, master, entity } = getEntityById(this, sourceId)!;
    const damage = new Damage(who, sourceId, target, value, type);
    this.emitImmediatelyHandledEvent("onEarlyBeforeDealDamage", damage);
    const changedType = damage.getType();
    if (changedType !== DamageType.Piercing) {
      const dmgCtx = new DamageContextImpl(this, who, sourceId, damage);
      const [newAura, reaction] = makeReactionFromDamage(dmgCtx);
      target.applied = newAura;
      if (reaction !== null) {
        this.emitEvent("onElementalReaction", who, sourceId, reaction);
      }
      this.emitImmediatelyHandledEvent("onBeforeDealDamage", damage);
      if (entity instanceof Skill) {
        this.emitImmediatelyHandledEvent("onBeforeSkillDamage", damage);
      }
      this.emitImmediatelyHandledEvent("onBeforeDamaged", damage);
    }
    target.health -= damage.getValue();
    if (target.health < 0) {
      target.health = 0;
    }
    this.emitEvent("onDamaged", damage);
    const damageLog: DamageData = {
      target: target.entityId,
      type: damage.getType(),
      value: damage.getValue(),
      log: [
        {
          source: entity instanceof Skill ? entity.info.id : entity.entityId,
          what: `Original damage ${value} with type ${type}`
        },
        ...damage.changedLogs.map(([s, c]) => ({
          source: s,
          what: `Change damage type to ${c}`
        })),
        ...damage.addedLogs.map(([s, c]) => ({
          source: s,
          what: `+${c} by ${s}`
        })),
        ...damage.multipliedLogs.map(([s, c]) => ({
          source: s,
          what: `*${c} by ${s}`
        })),
        ...damage.decreasedLogs.map(([s, c]) => ({
          source: s,
          what: `-${c} by ${s}`
        })),
      ]
    };
    this.notifyPlayer(0, { type: "stateUpdated", damages: [damageLog] });
    this.notifyPlayer(1, { type: "stateUpdated", damages: [damageLog] });
  }
  heal(target: Character, value: number, sourceId: number) {
    const oldHealth = target.health;
    target.health = Math.min(target.health + value, target.info.maxHealth);
    const diff = target.health - oldHealth;
    const damageLog: DamageData = {
      target: target.entityId,
      value: diff,
      type: DamageType.Heal,
      log: [
        {
          source: sourceId,
          what: `Heal ${value}(${diff}) HP`,
        },
      ],
    };
    this.notifyPlayer(0, { type: "stateUpdated", damages: [damageLog] });
    this.notifyPlayer(1, { type: "stateUpdated", damages: [damageLog] });
  }

  async doEvent() {
    const events = [...this.eventWaitingForHandle];
    this.eventWaitingForHandle = [];
    // TODO check death
    this.notifyPlayer(0, { type: "stateUpdated", damages: [] });
    this.notifyPlayer(1, { type: "stateUpdated", damages: [] });
    // 弃置所有标记为弃置的实体
    this.players[this.currentTurn].checkDispose();
    this.players[flip(this.currentTurn)].checkDispose();
    this.notifyPlayer(0, { type: "stateUpdated", damages: [] });
    this.notifyPlayer(1, { type: "stateUpdated", damages: [] });
    // 处理剩余事件
    for (const event of events) {
      for await (const r of this.handleEvent(event)) {
        this.notifyPlayer(0, { type: "stateUpdated", damages: [] });
        this.notifyPlayer(1, { type: "stateUpdated", damages: [] });
        // 每次处理完一个事件，检查新的状态
        this.doEvent();
        // 随后继续处理剩余事件
      }
    }
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
      const currentEnergy = player.getCharacter("active").energy;
      const costEnergy = hand.info.costs.filter(
        (c) => c === DiceType.Energy
      ).length;
      if (currentEnergy < costEnergy) {
        continue;
      }
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
    return clone;
  }
}
