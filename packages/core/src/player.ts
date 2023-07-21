import {
  DiceType,
  Event,
  MyPlayerData,
  OppPlayerData,
  PlayerDataBase,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/typings";
import { verifyRpcRequest, verifyRpcResponse } from "@gi-tcg/typings";
import * as _ from "lodash-es";

import { Card } from "./card.js";
import { GameOptions, PlayerConfig } from "./game.js";
import { Character } from "./character.js";
import { Status } from "./status.js";
import { Support } from "./support.js";
import { Summon } from "./summon.js";
import { ClonedObj, shallowClone } from "./entity.js";
import { GlobalOperations } from "./state.js";
import { CardTag, SkillInfoWithId, SpecialBits } from "@gi-tcg/data";
import {
  EventCreatorArgsForCharacter,
  EventFactory,
  EventHandlerNames1,
  PlayCardContextImpl,
  RequestFastToken,
  RollPhaseConfig,
} from "./context.js";
import {
  ActionConfig,
  ElementalTuningActionConfig,
  PlayCardTargetObj,
  SwitchActiveConfig,
  UseSkillConfig,
  rpcAction,
} from "./action.js";
import { checkDice } from "@gi-tcg/utils";
import { Skill } from "./skill.js";
import { Store } from "./immutable_test.js";

interface PlayerConfigWithGame extends PlayerConfig {
  game: GameOptions;
}

export type CharacterPosition = "active" | "prev" | "next";

export class Player {

  constructor(
    private store: Store,
    private readonly who: 0 | 1,
    private readonly config: PlayerConfigWithGame,
  ) {
    this.piles = config.deck.actions.map((id) => new Card(id));
    this.characters = config.deck.characters.map(
      (id) => new Character(id, this)
    );
    if (!config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
  }

  initHands() {
    const legends = this.piles
      .map((c, i) => [c, i] as const)
      .filter(([c]) => c.isLegend())
      .map(([c, i]) => i);
    this.drawHands(this.config.game.initialHands, legends);
  }

  cardsWithTagFromPile(tag: CardTag): number[] {
    return this.piles
      .filter((c) => c.info.tags.includes(tag))
      .map((c) => c.entityId);
  }

  async drawHands(count: number, controlled: number[] = []) {
    const drawn: Card[] = [];
    for (const cardIdx of controlled) {
      drawn.push(...this.piles.splice(cardIdx, 1));
      if (drawn.length === count) {
        break;
      }
    }
    if (drawn.length < count) {
      drawn.push(...this.piles.splice(0, count - drawn.length));
    }
    this.hands.push(...drawn);
    // "爆牌"
    const discardedCount = Math.max(0, this.hands.length - this.config.game.maxHands);
    this.hands.splice(this.config.game.maxHands, discardedCount);

    this.ops.notifyMe({ type: "stateUpdated", damages: [] });
    this.ops.notifyOpp({
      type: "oppChangeHands",
      removed: 0,
      added: this.hands.length,
      discarded: discardedCount,
    });
  }

  async switchHands() {
    const { removedHands } = await this.rpc("switchHands", {});
    const removed: Card[] = [];
    for (let i = 0; i < this.hands.length; i++) {
      if (removedHands.includes(this.hands[i].entityId)) {
        removed.push(this.hands[i]);
        this.hands.splice(i, 1);
        i--;
      }
    }
    this.piles.push(...removed);
    if (!this.config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
    this.ops.notifyOpp({
      type: "oppChangeHands",
      removed: removed.length,
      added: 0,
      discarded: 0,
    });
    this.drawHands(removed.length);
  }

  async chooseActive(delayNotify: false): Promise<void>;
  async chooseActive(delayNotify: true): Promise<() => void>;
  async chooseActive(delayNotify = false): Promise<any> {
    const activeId =
      this.activeIndex === null
        ? null
        : this.characters[this.activeIndex].entityId;
    const { active } = await this.rpc("chooseActive", {
      candidates: this.characters
        .filter((c) => {
          return c.isAlive() && c.entityId !== activeId;
        })
        .map((c) => c.entityId),
    });
    return this.switchActive(active, delayNotify);
  }

  async rollDice() {
    const config: RollPhaseConfig = {
      controlled: [],
      times: 1,
    };
    this.ops.emitImmediatelyHandledEvent("onRollPhase", config);
    this.dice = new Array(this.config.game.initialDice).fill(DiceType.Omni);
    if (!this.config.alwaysOmni) {
      this.doRollDice(config.controlled);
    }
    await this.rerollDice(config.times);
  }
  sortDice() {
    this.dice.sort((a, b) => this.diceValue(b) - this.diceValue(a));
    this.ops.notifyMe({ type: "stateUpdated", damages: [] });
  }
  private diceValue(x: DiceType): number {
    if (x === DiceType.Omni) {
      return 10000;
    } else if (x === this.getCharacter("active").elementType()) {
      return 1000;
    } else if (x === this.getCharacter("next").elementType()) {
      return 100;
    } else if (x === this.getCharacter("prev").elementType()) {
      return 10;
    } else {
      return -x;
    }
  }
  private doRollDice(controlled: DiceType[]) {
    const rerollCount = this.dice.length - controlled.length;
    this.dice = [...controlled];
    for (let i = 0; i < rerollCount; i++) {
      this.dice.push(Math.floor(Math.random() * 8) + 1);
    }
    this.sortDice();
  }

  async rerollDice(times: number) {
    for (let i = 0; i < times; i++) {
      if (this.dice.length !== 0) {
        const { rerollIndexes } = await this.rpc("rerollDice", {});
        if (rerollIndexes.length === 0) {
          break;
        }
        const controlled = [...this.dice];
        _.pullAt(controlled, rerollIndexes);
        this.doRollDice(controlled);
      }
    }
  }

  getCharacter(target: CharacterPosition): Character {
    let chIndex = (this.activeIndex ?? 0) + this.characters.length;
    while (true) {
      switch (target) {
        case "next": {
          chIndex++;
          const ch = this.characters[chIndex % this.characters.length];
          if (!ch.isAlive()) continue;
          return ch;
        }
        case "prev": {
          chIndex--;
          const ch = this.characters[chIndex % this.characters.length];
          if (!ch.isAlive()) continue;
          return ch;
        }
        case "active":
          return this.characters[chIndex % this.characters.length];
      }
    }
  }
  getCharacterById(id: number, useStaticId = false): Character | undefined {
    return this.characters.find((c) =>
      useStaticId ? c.info.id === id : c.entityId === id
    );
  }
  getCharacterByPos(posIndex: number): Character {
    const ch = this.characters[posIndex % 3];
    if (!ch.isAlive()) {
      return this.getCharacterByPos(posIndex + 1);
    } else {
      return ch;
    }
  }

  // 消耗骰子或能量
  private consumeDice(required: DiceType[], consumed: DiceType[]) {
    if (!checkDice(required, consumed)) {
      throw new Error("Invalid dice");
    }
    const activeCh = this.getCharacter("active");
    const currentEnergy = activeCh.energy;
    const costEnergy = required.filter((c) => c === DiceType.Energy).length;
    if (currentEnergy < costEnergy) {
      throw new Error("Not enough energy");
    }
    activeCh.energy -= costEnergy;
    for (const d of consumed) {
      const idx = this.dice.indexOf(d);
      if (idx === -1) {
        throw new Error("Invalid dice");
      }
      this.dice.splice(idx, 1);
    }
    this.sortDice();
  }

  /**
   * @returns is fast action
   */
  async action(): Promise<boolean> {
    this.ops.notifyOpp({ type: "oppAction" });
    const ch = this.getCharacter("active");
    const canUseSkill = !ch.skillDisabled();
    // 检查准备中技能
    const preparingStatus = ch.statuses.find((st) => st.preparing());
    if (canUseSkill && preparingStatus) {
      const preparing = preparingStatus.preparing()!;
      switch (preparing.type) {
        case "skill": {
          const skillObj = ch.skills.find((s) => s.entityId === preparing.id);
          if (typeof skillObj === "undefined") {
            throw new Error(`preparing skill ${preparing.id} not found}`)
          }
          await this.useSkill(skillObj);
          break;
        }
        case "status": {
          ch.createStatus(preparing.id);
          break;
        }
      }
      preparingStatus.shouldDispose = true;
      await this.ops.doEvent();
      return false; // 以慢速行动跳过本回合
    }
    this.ops.emitEvent("onBeforeAction");
    await this.ops.doEvent();
    // 收集可用行动
    const actions: ActionConfig[] = [
      {
        type: "declareEnd",
      },
    ];
    const fastSwitchToken: RequestFastToken = {
      resolved: false
    };
    this.ops.emitImmediatelyHandledEvent("onRequestFastSwitchActive", fastSwitchToken);
    if (canUseSkill) {
      actions.push(
        ...ch.skills
          .filter(
            // Enough energy
            (s) =>
              s.info.costs.filter((d) => d === DiceType.Energy).length <=
              ch.energy
          )
          .map(
            (s): UseSkillConfig => ({
              type: "useSkill",
              dice: [...s.info.costs],
              skill: s,
            })
          )
      );
    }
    actions.push(...this.ops.getCardActions());
    actions.push(
      ...this.characters
        .filter((c) => c.isAlive() && c.entityId !== ch.entityId)
        .map(
          (c): SwitchActiveConfig => ({
            type: "switchActive",
            dice: [DiceType.Void],
            from: ch,
            to: c,
            fast: fastSwitchToken.resolved,
          })
        )
    );
    actions.push(
      ...this.hands.map(
        (h): ElementalTuningActionConfig => ({
          type: "elementalTuning",
          card: h,
        })
      )
    );
    for (const action of actions) {
      this.ops.emitImmediatelyHandledEvent("onBeforeUseDice", action);
    }
    const action = await rpcAction(actions, (r) => this.rpc("action", r));
    switch (action.type) {
      case "declareEnd": {
        this.setSpecialBit(SpecialBits.DeclaredEnd, true);
        this.ops.notifyMe({ type: "declareEnd", opp: false });
        this.ops.notifyOpp({ type: "declareEnd", opp: true });
        this.ops.emitEvent("onDeclareEnd");
        return false;
      }
      case "elementalTuning": {
        const diceIndex = this.dice.indexOf(action.consumedDice[0]);
        if (diceIndex === -1) {
          throw new Error("Invalid dice");
        }
        const cardIdx = this.hands.findIndex(
          (c) => c.entityId === action.card.entityId
        );
        if (cardIdx === -1) {
          throw new Error("Invalid card");
        }
        this.hands.splice(cardIdx, 1);
        this.dice[diceIndex] = this.getCharacter("active").elementType();
        this.sortDice();
        this.ops.notifyOpp({
          type: "oppChangeHands",
          removed: 0,
          added: 0,
          discarded: 1,
        });
        return true;
      }
      case "useSkill": {
        this.consumeDice(action.dice, action.consumedDice);
        await this.useSkill(action.skill);
        return false;
      }
      case "playCard": {
        this.consumeDice(action.dice, action.consumedDice);
        await this.playCard(action.card, action.targets);
        return !action.card.info.tags.includes("action");
      }
      case "switchActive": {
        this.consumeDice(action.dice, action.consumedDice);
        this.switchActive(action.to.entityId);
        return action.fast;
      }
    }
  }

  async useSkill(skill: Skill, sourceId?: number) {
    const ch = this.getCharacter("active");
    if (ch.skillDisabled()) return; // 下落斩、雷楔等无法提前检测到的技能禁用
    const index = ch.skills.findIndex(
      (s) => s.entityId === skill.entityId
    );
    if (index === -1) {
      throw new Error("Invalid skill");
    }
    this.notifySkill(skill.info);
    const ctx = this.ops.getSkillContext(skill, sourceId);
    skill.do(ctx);
    if (skill.info.gainEnergy) {
      ch.gainEnergy();
    }
    await this.ops.doEvent();
    this.ops.emitEvent("onUseSkill", skill);
    // await this.ops.doEvent();
  }

  async playCard(hand: Card, targets: PlayCardTargetObj[]) {
    const index = this.hands.findIndex((c) => c.entityId === hand.entityId);
    if (index === -1) {
      throw new Error("Invalid card");
    }
    this.playingCard = hand;
    this.hands.splice(index, 1);
    this.ops.notifyMe({ type: "playCard", card: hand.info.id, opp: false });
    this.ops.notifyOpp({ type: "playCard", card: hand.info.id, opp: true });
    const ctx = this.ops.getCardContext(hand, targets);
    for await (const r of hand.do(ctx)) {
      this.ops.doEvent();
    }
    this.ops.emitEvent("onPlayCard", hand, targets);
  }

  switchActive(targetEntityId: number, delayNotify = false): any {
    const from = this.getCharacter("active");
    this.activeIndex = this.characters.findIndex(
      (c) => c.entityId === targetEntityId
    );
    const to = this.getCharacter("active");
    this.ops.notifyMe({
      type: "switchActive",
      opp: false,
      target: targetEntityId,
    });
    const oppNotify = () => {
      this.ops.notifyOpp({
        type: "switchActive",
        opp: true,
        target: targetEntityId,
      });
    };
    if (delayNotify) {
      return oppNotify;
    }
    oppNotify();
    // 取消准备技能
    const preparingSkill = from.statuses.find(s => s.preparing());
    if (preparingSkill) {
      preparingSkill.shouldDispose = true;
    }
    this.ops.emitEvent("onSwitchActive", from, to);
  }

  createCombatStatus(newStatusId: number) {
    const oldStatus = this.combatStatuses.find(s => s.info.id === newStatusId);
    if (oldStatus) {
      oldStatus.refresh();
      return oldStatus;
    } else {
      const newStatus = new Status(newStatusId);
      this.combatStatuses.push(newStatus);
      return newStatus;
    }
  }
  fullSupportArea(): boolean {
    return this.supports.length >= this.config.game.maxSupports;
  }
  /**
   * 检查标记为“应当弃置”的实体并弃置它们
   */
  checkDispose() {
    const activeIndex = this.activeIndex ?? 0;
    for (let i = 0; i < this.characters.length; i++) {
      const character =
        this.characters[(activeIndex + i) % this.characters.length];
      for (let j = 0; j < character.statuses.length; j++) {
        if (character.statuses[j].shouldDispose) {
          character.statuses.splice(j, 1);
          j--;
        }
      }
    }
    for (let i = 0; i < this.combatStatuses.length; i++) {
      if (this.combatStatuses[i].shouldDispose) {
        this.combatStatuses.splice(i, 1);
        i--;
      }
    }
    for (let i = 0; i < this.summons.length; i++) {
      if (this.summons[i].shouldDispose) {
        this.summons.splice(i, 1);
        i--;
      }
    }
    for (let i = 0; i < this.supports.length; i++) {
      if (this.supports[i].shouldDispose) {
        this.supports.splice(i, 1);
        i--;
      }
    }
  }

  emitEventFromCharacter<K extends EventHandlerNames1>(
    ch: Character,
    event: K,
    ...rest: EventCreatorArgsForCharacter<K>
  ) {
    // @ts-expect-error TS sucks
    this.ops.emitEvent(event, ch, ...rest);
  }
  notifySkill(skillInfo: SkillInfoWithId) {
    this.ops.notifyMe({ type: "useSkill", skill: skillInfo.id, opp: false });
    this.ops.notifyOpp({ type: "useSkill", skill: skillInfo.id, opp: true });
  }

  async *handleEvent(event: EventFactory) {
    const activeIndex = this.activeIndex ?? 0;
    for (let i = 0; i < this.characters.length; i++) {
      const character =
        this.characters[(activeIndex + i) % this.characters.length];
      if (character.isAlive()) {
        for await (const r of character.handleEvent(event)) {
          yield;
        }
      }
    }
    for (const status of this.combatStatuses) {
      await status.handleEvent(event);
      yield;
    }
    for (const summon of this.summons) {
      await summon.handleEvent(event);
      yield;
    }
    for (const support of this.supports) {
      await support.handleEvent(event);
      yield;
    }
  }
  handleEventSync(event: EventFactory) {
    const activeIndex = this.activeIndex ?? 0;
    for (let i = 0; i < this.characters.length; i++) {
      const character =
        this.characters[(activeIndex + i) % this.characters.length];
      if (character.isAlive()) {
        character.handleEventSync(event);
      }
    }
    for (const status of this.combatStatuses) {
      status.handleEventSync(event);
    }
    for (const summon of this.summons) {
      summon.handleEventSync(event);
    }
    for (const support of this.supports) {
      support.handleEventSync(event);
    }
  }

  private async rpc<M extends RpcMethod>(
    method: M,
    data: RpcRequest[M]
  ): Promise<RpcResponse[M]> {
    if (ClonedObj in this) {
      throw new Error("Cannot call rpc in cloned player");
    }
    verifyRpcRequest(method, data);
    const resp = await this.config.handler(method, data);
    verifyRpcResponse(method, resp);
    return resp;
  }

  public getSpecialBit(bit: SpecialBits): boolean {
    return (this.specialBits & (1 << bit)) !== 0;
  }
  public setSpecialBit(bit: SpecialBits, value = true) {
    if (value) {
      this.specialBits |= 1 << bit;
    } else {
      this.specialBits &= ~(1 << bit);
    }
  }
  public cleanSpecialBits(...bits: SpecialBits[]) {
    for (const bit of bits) {
      this.specialBits &= ~(1 << bit);
    }
  }

  private getDataBase(): PlayerDataBase {
    return {
      pileNumber: this.piles.length,
      active:
        this.activeIndex === null
          ? null
          : this.characters[this.activeIndex].entityId,
      characters: this.characters.map((c) => c.getData()),
      combatStatuses: this.combatStatuses.map((s) => s.getData()),
      supports: this.supports.map((s) => s.getData()),
      summons: this.summons.map((s) => s.getData()),
      legendUsed: this.getSpecialBit(SpecialBits.LegendUsed),
    };
  }
  getData(): MyPlayerData {
    return {
      type: "my",
      hands: this.hands.map((c) => c.getData()),
      dice: [...this.dice],
      ...this.getDataBase(),
    };
  }
  getDataForOpp(): OppPlayerData {
    return {
      type: "opp",
      hands: this.hands.length,
      dice: this.dice.length,
      ...this.getDataBase(),
    };
  }

  clone() {
    const clone = shallowClone(this);
    // Card is not stateful, no need to deep clone (FOR NOW)
    // clone.piles = this.piles.map(c => c.clone());
    // clone.hands = this.hands.map(c => c.clone());
    // Cloned object shouldn't have side effects
    clone.characters = this.characters.map((c) => c.clone());
    clone.combatStatuses = this.combatStatuses.map((s) => s.clone());
    clone.supports = this.supports.map((s) => s.clone());
    clone.summons = this.summons.map((s) => s.clone());
    return clone;
  }
}
