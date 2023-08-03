import {
  DiceType,
  MyPlayerData,
  OppPlayerData,
  PlayerDataBase,
} from "@gi-tcg/typings";
import * as _ from "lodash-es";
import {
  CharacterPath,
  characterElementType,
  characterSkills,
  createStatus,
  gainEnergy,
  getCharacterData,
  loseEnergy,
  skillDisabled,
} from "./character.js";
import {
  AsyncEventMap,
  CardInfo,
  CardTag,
  NormalSkillInfo,
  SyncEventMap,
  getCard,
  getSkill,
} from "@gi-tcg/data";
import { CreatorArgsForPlayer, RollPhaseConfig } from "./context.js";
import {
  ActionConfig,
  ElementalTuningActionConfig,
  PlayCardTargetPath,
  SwitchActiveConfig,
  UseSkillConfig,
  getCardActions,
  rpcAction,
} from "./action.js";
import { checkDice } from "@gi-tcg/utils";
import {
  CardState,
  CharacterState,
  GameState,
  PlayerState,
  Store,
  findEntity,
  getCharacterAtPath,
} from "./store.js";
import { Draft } from "immer";
import { IONotAvailableError, PlayerIO } from "./io.js";
import {
  CardPath,
  EntityPath,
  SkillPath,
  StatusState,
  SummonState,
  SupportState,
  createEntity,
  getEntityData,
  newEntityId,
  refreshEntity,
} from "./entity.js";
import { playCard } from "./card.js";
import { useSkill, getSkillEx } from "./skill.js";

interface PlayerOptions {
  initialHands: number;
  maxHands: number;
  maxSupports: number;
  maxSummons: number;
  initialDice: number;
  maxDice: number;
  noShuffle: boolean;
  alwaysOmni: boolean;
}

export class PlayerMutator {
  private config: PlayerOptions;
  constructor(
    private readonly store: Store,
    private readonly who: 0 | 1,
  ) {
    this.config = {
      maxHands: this.store.state.config.maxHands,
      initialDice: this.store.state.config.initialDice,
      initialHands: this.store.state.config.initialHands,
      maxDice: this.store.state.config.maxDice,
      maxSummons: this.store.state.config.maxSummons,
      maxSupports: this.store.state.config.maxSupports,
      alwaysOmni: this.state.config.alwaysOmni,
      noShuffle: this.state.config.noShuffle,
    };
  }

  private get io() {
    return this.store._playerIO[this.who];
  }
  private get state() {
    return this.store.state.players[this.who];
  }
  private produce(fn: (draft: Draft<PlayerState>) => void) {
    this.store._produce((s) => {
      fn(s.players[this.who]);
    });
  }
  private emitEvent<E extends keyof AsyncEventMap>(
    e: E,
    ...args: CreatorArgsForPlayer<E>
  ) {
    // @ts-expect-error oops
    this.store.mutator.emitEvent(e, this.who, ...args);
  }
  private emitSyncEvent<E extends keyof SyncEventMap>(
    e: E,
    ...args: CreatorArgsForPlayer<E>
  ) {
    // @ts-expect-error oops
    this.store.mutator.emitSyncEvent(e, this.who, ...args);
  }
  private async doEvent() {
    await this.store.mutator.doEvent();
  }

  initHands() {
    const legends = this.state.piles
      .map((c, i) => [c, i] as const)
      .filter(([c]) => c.info.tags.includes("legend"))
      .map(([, i]) => i);
    this.drawHands(this.config.initialHands, legends);
  }

  cardsWithTagFromPile(tag: CardTag): number[] {
    return this.state.piles
      .filter((c) => c.info.tags.includes(tag))
      .map((c) => c.entityId);
  }

  async drawHands(count: number, controlled: number[] = []) {
    let discardedCount = 0;
    const drawn: Draft<CardState>[] = [];
    this.produce((draft) => {
      for (const cardIdx of controlled) {
        drawn.push(...draft.piles.splice(cardIdx, 1));
        if (drawn.length === count) {
          break;
        }
      }
      if (drawn.length < count) {
        drawn.push(...draft.piles.splice(0, count - drawn.length));
      }
      draft.hands.push(...drawn);
      // "爆牌"
      discardedCount = Math.max(0, draft.hands.length - this.config.maxHands);
      draft.hands.splice(this.config.maxHands, discardedCount);
    });

    this.io?.notifyMe({ type: "stateUpdated", damages: [] });
    this.io?.notifyOpp({
      type: "oppChangeHands",
      removed: 0,
      added: drawn.length,
      discarded: discardedCount,
    });
  }

  async switchHands() {
    if (!this.io) {
      throw new IONotAvailableError();
    }
    const { removedHands } = await this.io.rpc("switchHands", {});
    const removed: Draft<CardState>[] = [];

    // Remove hands
    this.produce((draft) => {
      for (let i = 0; i < draft.hands.length; i++) {
        if (removedHands.includes(draft.hands[i].entityId)) {
          removed.push(draft.hands[i]);
          draft.hands.splice(i, 1);
          i--;
        }
      }
      draft.piles.push(...removed);
      if (!this.config.noShuffle) {
        draft.piles = _.shuffle(draft.piles);
      }
    });
    this.io?.notifyOpp({
      type: "oppChangeHands",
      removed: removed.length,
      added: 0,
      discarded: 0,
    });

    this.drawHands(removed.length);
  }
  createHands(...cardIds: number[]) {
    this.produce((draft) => {
      draft.hands.push(
        ...cardIds.map((card) => ({
          entityId: newEntityId(),
          info: getCard(card) as Draft<CardInfo>, // make TypeScript happy
        })),
      );
    });
  }

  async chooseActive(delayNotify?: false): Promise<void>;
  async chooseActive(delayNotify: true): Promise<() => void>;
  async chooseActive(delayNotify = false): Promise<unknown> {
    if (!this.io) {
      throw new IONotAvailableError();
    }
    const activeId = this.state.active
      ? getCharacterAtPath(this.state, this.state.active).entityId
      : null;
    const { active } = await this.io.rpc("chooseActive", {
      candidates: this.state.characters
        .filter((c) => {
          return !c.defeated && c.entityId !== activeId;
        })
        .map((c) => c.entityId),
    });
    return this.switchActive(active, delayNotify);
  }

  async rollPhase() {
    this.produce((draft) => {
      draft.declaredEnd = false;
      draft.canPlunging = false;
      draft.hasDefeated = false;
      draft.skipNextTurn = false;
      draft.skillLog = [];
      draft.cardLog = [];
    });
    const config: RollPhaseConfig = {
      controlled: [],
      times: 1,
    };
    // TODO onRollPhase
    this.produce((draft) => {
      draft.dice = new Array(this.config.initialDice).fill(DiceType.Omni);
    });
    if (!this.config.alwaysOmni) {
      this.doRollDice(config.controlled);
    }
    await this.rerollDice(config.times);
  }
  private sortDice() {
    this.produce((draft) => {
      draft.dice.sort((a, b) => this.diceValue(b) - this.diceValue(a));
    });
    this.io?.notifyMe({ type: "stateUpdated", damages: [] });
  }
  private diceValue(x: DiceType): number {
    if (x === DiceType.Omni) {
      return 10000;
    } else if (x === characterElementType(this.activeCharacter()[0])) {
      return 1000;
    } else if (this.state.characters.map(characterElementType).includes(x)) {
      return 100 - x;
    } else {
      return -x;
    }
  }
  private doRollDice(controlled: DiceType[]) {
    this.produce((draft) => {
      const rerollCount = draft.dice.length - controlled.length;
      draft.dice = [...controlled];
      for (let i = 0; i < rerollCount; i++) {
        draft.dice.push(Math.floor(Math.random() * 8) + 1);
      }
    });
    this.sortDice();
  }

  async rerollDice(times: number) {
    if (!this.io) {
      throw new IONotAvailableError();
    }
    for (let i = 0; i < times; i++) {
      if (this.state.dice.length !== 0) {
        const { rerollIndexes } = await this.io.rpc("rerollDice", {});
        if (rerollIndexes.length === 0) {
          break;
        }
        const controlled = [...this.state.dice];
        _.pullAt(controlled, rerollIndexes);
        this.doRollDice(controlled);
      }
    }
  }

  absorbDice(indexes: number[]): DiceType[] {
    let result: DiceType[] = [];
    this.produce((draft) => {
      result = _.pullAt(draft.dice, indexes);
    });
    return result;
  }
  generateDice(...dice: DiceType[]): void {
    this.produce((draft) => {
      draft.dice.push(...dice);
    });
    this.sortDice();
  }

  private activeCharacter(): [CharacterState, CharacterPath] {
    if (this.state.active === null) {
      throw new Error("No active character");
    }
    return [
      getCharacterAtPath(this.state, this.state.active),
      this.state.active,
    ];
  }
  private findCharacter(
    pred: (c: CharacterState) => boolean,
  ): [CharacterState, CharacterPath][] {
    return this.state.characters
      .map((c, i): [CharacterState, CharacterPath] => [
        c,
        {
          who: this.who,
          entityId: c.entityId,
          indexHint: i,
          info: c.info,
        },
      ])
      .filter(([c]) => pred(c));
  }

  // 消耗骰子或能量
  private consumeDice(required: DiceType[], consumed: DiceType[]) {
    if (!checkDice(required, consumed)) {
      throw new Error("Invalid dice");
    }
    const [activeCh] = this.activeCharacter();
    const currentEnergy = activeCh.energy;
    const costEnergy = required.filter((c) => c === DiceType.Energy).length;
    if (currentEnergy < costEnergy) {
      throw new Error("Not enough energy");
    }
    this.store.updateCharacterAtPath(this.state.active!, (c) =>
      loseEnergy(c, costEnergy),
    );
    this.produce((draft) => {
      for (const d of consumed) {
        const idx = draft.dice.indexOf(d);
        if (idx === -1) {
          throw new Error("Invalid dice");
        }
        draft.dice.splice(idx, 1);
      }
    });
    this.sortDice();
  }

  /**
   * @returns is fast action
   */
  async action(): Promise<boolean> {
    if (!this.io) {
      throw new IONotAvailableError();
    }
    this.io.notifyOpp({ type: "oppAction" });
    const [ch, chPath] = this.activeCharacter();
    const canUseSkill = !skillDisabled(ch);
    // 检查准备中技能
    const preparingStatuses = findEntity(
      this.store.state,
      chPath,
      "status",
      (st) => st.info.prepare !== null,
    );
    if (canUseSkill && preparingStatuses.length > 0) {
      const [preparingStatus, path] = preparingStatuses[0];
      const preparConfig = preparingStatus.info.prepare!;
      if (preparConfig.round === 1) {
        await this.useSkill(
          getSkillEx(this.store.state, chPath, preparConfig.skillOrStatus),
        );
      } else {
        this.store.updateCharacterAtPath(this.state.active!, (c, p) => {
          createStatus(c, p, preparConfig.skillOrStatus);
        });
      }
      this.store.updateEntityAtPath(path, (s) => {
        s.shouldDispose = true;
      });
      await this.doEvent();
      return false; // 以慢速行动跳过本回合
    }
    this.emitEvent("onBeforeAction");
    await this.doEvent();
    // 收集可用行动
    const actions: ActionConfig[] = [
      {
        type: "declareEnd",
      },
    ];
    if (canUseSkill) {
      const skills = ch.info.skills
        .map((s) => getSkill(s))
        .filter((info): info is NormalSkillInfo => info.type !== "passive");
      actions.push(
        ...skills
          .filter(
            // Enough energy
            (s) =>
              s.costs.filter((d) => d === DiceType.Energy).length <= ch.energy,
          )
          .map(
            (s): UseSkillConfig => ({
              type: "useSkill",
              dice: [...s.costs],
              skill: getSkillEx(this.store.state, chPath, s.id),
            }),
          ),
      );
    }
    actions.push(...getCardActions(this.store.state, this.who));
    actions.push(
      ...this.findCharacter(
        (c) => !c.defeated && c.entityId !== ch.entityId,
      ).map(
        (c): SwitchActiveConfig => ({
          type: "switchActive",
          dice: [DiceType.Void],
          from: chPath,
          to: c[1],
          fast: false,
        }),
      ),
    );
    actions.push(
      ...this.state.hands.map(
        (h): ElementalTuningActionConfig => ({
          type: "elementalTuning",
          card: {
            who: this.who,
            type: "card",
            entityId: h.entityId,
            info: h.info,
          },
        }),
      ),
    );

    const usedDiceState: GameState[] = [];
    for (const action of actions) {
      usedDiceState.push(
        this.store.mutator.emitBeforeUseDice(this.who, action),
      );
    }
    const { configIndex, consumedDice } = await rpcAction(actions, (r) =>
      this.io!.rpc("action", r),
    );
    const action = actions[configIndex];
    this.store.apply(usedDiceState[configIndex]);

    switch (action.type) {
      case "declareEnd": {
        this.produce((draft) => {
          draft.declaredEnd = true;
        });
        this.io?.notifyMe({ type: "declareEnd", opp: false });
        this.io?.notifyOpp({ type: "declareEnd", opp: true });
        this.emitEvent("onDeclareEnd");
        return false;
      }
      case "elementalTuning": {
        const diceIndex = this.state.dice.indexOf(consumedDice[0]);
        if (diceIndex === -1) {
          throw new Error("Invalid dice");
        }
        const cardIdx = this.state.hands.findIndex(
          (c) => c.entityId === action.card.entityId,
        );
        if (cardIdx === -1) {
          throw new Error("Invalid card");
        }
        this.produce((draft) => {
          draft.hands.splice(cardIdx, 1);
          draft.dice[diceIndex] = characterElementType(
            this.activeCharacter()[0],
          );
        });
        this.sortDice();
        this.io?.notifyOpp({
          type: "oppChangeHands",
          removed: 0,
          added: 0,
          discarded: 1,
        });
        return true;
      }
      case "useSkill": {
        this.consumeDice(action.dice, consumedDice);
        await this.useSkill(action.skill);
        return false;
      }
      case "playCard": {
        this.consumeDice(action.dice, consumedDice);
        await this.playCard(action.card, action.targets);
        return !action.card.info.tags.includes("action");
      }
      case "switchActive": {
        this.consumeDice(action.dice, consumedDice);
        this.switchActive(action.to.entityId);
        return action.fast;
      }
    }
  }

  async useSkill(skill: SkillPath, caller?: EntityPath) {
    const [ch, chPath] = this.activeCharacter();
    if (skillDisabled(ch)) return; // 下落斩、雷楔等无法提前检测到的技能禁用
    const index = characterSkills(ch).findIndex((s) => s.id === skill.info.id);
    if (index === -1) {
      throw new Error("Invalid skill");
    }

    this.store.mutator.cleanSkillLog();
    this.io?.notifyMe({ type: "useSkill", skill: skill.info.id, opp: false });
    this.io?.notifyOpp({ type: "useSkill", skill: skill.info.id, opp: true });

    await useSkill(this.store, caller ?? skill, skill);
    if (skill.info.gainEnergy) {
      this.store.updateCharacterAtPath(chPath, (c) => {
        gainEnergy(c);
      });
    }
    this.produce((draft) => {
      draft.skillLog.push([this.store.state.roundNumber, skill.info.id]);
      draft.canPlunging = false;
    });
    await this.doEvent();
    this.emitEvent("onUseSkill", skill);
    await this.doEvent();
  }

  async playCard(hand: CardPath, targets: PlayCardTargetPath[]) {
    const index = this.state.hands.findIndex(
      (c) => c.entityId === hand.entityId,
    );
    if (index === -1) {
      throw new Error("Invalid card");
    }
    this.produce((draft) => {
      draft.hands.splice(index, 1);
      draft.cardLog.push([this.store.state.roundNumber, hand.info.id]);
    });
    this.io?.notifyMe({ type: "playCard", card: hand.info.id, opp: false });
    this.io?.notifyOpp({ type: "playCard", card: hand.info.id, opp: true });
    for await (const r of playCard(this.store, hand, targets)) {
      await this.doEvent();
    }
    this.emitEvent("onPlayCard", hand, targets);
  }

  switchActive(targetEntityId: number, delayNotify = false): any {
    const fromPath = this.state.active ? this.activeCharacter()[1] : null;
    const newActiveIndex = this.state.characters.findIndex(
      (c) => c.entityId === targetEntityId,
    );
    if (newActiveIndex === -1) {
      throw new Error("Invalid character");
    }
    this.produce((draft) => {
      draft.active = {
        who: this.who,
        info: draft.characters[newActiveIndex].info,
        entityId: targetEntityId,
        indexHint: newActiveIndex,
      };
      draft.canPlunging = true;
    });
    const [to, toPath] = this.activeCharacter();
    this.io?.notifyMe({
      type: "switchActive",
      opp: false,
      target: targetEntityId,
    });
    const oppNotify = () => {
      this.io?.notifyOpp({
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
    if (fromPath) {
      const preparing = findEntity(
        this.store.state,
        fromPath,
        "status",
        (s) => s.info.prepare !== null,
      );
      preparing.forEach(([, path]) => {
        this.store.updateEntityAtPath(path, (s) => {
          s.shouldDispose = true;
        });
      });
    }
    this.emitEvent("onSwitchActive", fromPath, toPath);
  }

  private createEntity(
    type: "status" | "support" | "summon",
    id: number,
  ): EntityPath {
    if (type !== "support") {
      const oldStatus = findEntity(
        this.store.state,
        this.who,
        type,
        (s) => s.info.id === id,
      );
      if (oldStatus.length > 0) {
        this.store.updateEntityAtPath(
          oldStatus[0][1],
          (s: Draft<StatusState>) => refreshEntity(s),
        );
        return oldStatus[0][1];
      }
    }
    const newIdx = this.state.combatStatuses.length;
    const entity = createEntity(type, id);
    this.produce((draft) => {
      if (type === "summon") {
        draft.summons.push(entity as SummonState);
      } else if (type === "support") {
        draft.supports.push(entity as SupportState);
      } else {
        draft.combatStatuses.push(entity as StatusState);
      }
    });
    const path = {
      type: type,
      who: this.who,
      info: entity.info,
      entityId: entity.entityId,
      indexHint: newIdx,
    };
    this.store.mutator.emitEvent("onEnter", path);
    return path;
  }
  createCombatStatus(statusId: number): EntityPath {
    return this.createEntity("status", statusId);
  }
  createSummon(summonId: number): EntityPath {
    return this.createEntity("summon", summonId);
  }
  createSupport(supportId: number): EntityPath {
    return this.createEntity("support", supportId);
  }

  skipNextTurn() {
    this.produce((draft) => {
      draft.skipNextTurn = true;
    });
  }
}

export function fullSupportArea(state: GameState, who: 0 | 1): boolean {
  return state.players[who].supports.length >= state.config.maxSupports;
}

export function getPlayerData(state: PlayerState, opp?: false): MyPlayerData;
export function getPlayerData(state: PlayerState, opp: true): OppPlayerData;
export function getPlayerData(
  state: PlayerState,
  opp = false,
): MyPlayerData | OppPlayerData {
  const base: PlayerDataBase = {
    pileNumber: state.piles.length,
    active: state.active
      ? getCharacterAtPath(state, state.active).entityId
      : null,
    characters: state.characters.map(getCharacterData),
    combatStatuses: state.combatStatuses.map(getEntityData),
    supports: state.supports.map(getEntityData),
    summons: state.summons.map(getEntityData),
    legendUsed: state.legendUsed,
  };
  if (opp) {
    return {
      ...base,
      type: "opp",
      hands: state.hands.length,
      dice: state.dice.length,
    };
  } else {
    return {
      ...base,
      type: "my",
      hands: state.hands.map((c) => ({
        id: c.info.id,
        entityId: c.entityId,
      })),
      dice: [...state.dice],
    };
  }
}
