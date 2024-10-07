import { DiceType, ExposedMutation } from "@gi-tcg/typings";
import { CardState, GameState } from "./base/state";
import { DetailLogType, IDetailLogger } from "./log";
import {
  Mutation,
  StepRandomM,
  applyMutation,
  stringifyMutation,
} from "./base/mutation";
import { EntityState, EntityVariables, stringifyState } from "./base/state";
import { allEntitiesAtArea, getEntityById, sortDice } from "./utils";
import { GiTcgCoreInternalError, GiTcgDataError } from "./error";
import { EnterEventArg, EventAndRequest, SelectCardInfo } from "./base/skill";
import {
  EntityArea,
  EntityDefinition,
  stringifyEntityArea,
} from "./base/entity";
import { CardDefinition } from "./base/card";

export class GiTcgPreviewAbortedError extends GiTcgCoreInternalError {
  constructor(message?: string) {
    super(`${message ?? "Preview aborted."} This error should be caught.`);
  }
}

export class GiTcgIoNotProvideError extends GiTcgPreviewAbortedError {
  constructor() {
    super("IO is not provided.");
  }
}

export interface NotifyOption {
  canResume?: boolean;
  mutations?: readonly ExposedMutation[];
}

export interface InternalPauseOption {
  state: GameState;
  canResume: boolean;
  /** 自上次通知后，对局状态发生的所有变化 */
  stateMutations: readonly Mutation[];
}
export interface InternalNotifyOption extends InternalPauseOption {
  /** 上层传入的其他变化（可直接输出前端） */
  exposedMutations: readonly ExposedMutation[];
}

export interface MutateOption {
  /**
   * 详细日志输出器。
   */
  logger?: IDetailLogger;
}

export interface CreateEntityOptions {
  /** 创建实体时，覆盖默认变量 */
  overrideVariables?: Partial<EntityVariables>;
  /** 设定创建实体的 id。仅在打出支援牌和装备牌时直接继承原手牌 id */
  withId?: number;
}

export interface CreateEntityResult {
  /** 若重复创建，给出被覆盖的原实体状态 */
  readonly oldState: EntityState | null;
  /** 若成功创建，给出新建的实体状态 */
  readonly newState: EntityState | null;
}

/**
 * 管理一个状态和状态的修改。
 *
 * - 当状态发生修改时，向日志输出；
 * - `notify` 方法会附加所有的修改信息。
 */
export abstract class StateMutator {
  private _state: GameState;
  private _mutationsToBeNotified: Mutation[] = [];
  private _mutationsToBePause: Mutation[] = [];
  private _first = true;
  get state() {
    return this._state;
  }
  protected resetState(newState: GameState) {
    if (this._mutationsToBeNotified.length > 0) {
      console.warn("Resetting state with pending mutations not notified");
      console.warn(this._mutationsToBeNotified);
      // debugger;
    }
    this._state = newState;
    this._mutationsToBeNotified = [];
    this._mutationsToBePause = [];
  }
  constructor(
    initialState: GameState,
    private opt: MutateOption = {},
  ) {
    this._state = initialState;
  }
  protected log(type: DetailLogType, value: string): void {
    return this.opt.logger?.log(type, value);
  }
  protected subLog(type: DetailLogType, value: string) {
    return this.opt.logger?.subLog(type, value);
  }
  protected mutate(mutation: Mutation) {
    this._state = applyMutation(this.state, mutation);
    const str = stringifyMutation(mutation);
    if (str) {
      this.log(DetailLogType.Mutation, str);
    }
    this._mutationsToBeNotified.push(mutation);
    this._mutationsToBePause.push(mutation);
  }
  private createNotifyInternalOption(opt: NotifyOption): InternalNotifyOption {
    const result = {
      state: this.state,
      canResume: opt.canResume ?? false,
      stateMutations: this._mutationsToBeNotified,
      exposedMutations: opt.mutations ?? [],
    };
    this._mutationsToBeNotified = [];
    return result;
  }
  private createPauseInternalOption(opt: NotifyOption): InternalPauseOption {
    const result = {
      state: this.state,
      canResume: opt.canResume ?? false,
      stateMutations: this._mutationsToBePause,
      exposedMutations: opt.mutations ?? [],
    };
    this._mutationsToBePause = [];
    return result;
  }
  protected notify(opt: NotifyOption = {}) {
    const internalOpt = this.createNotifyInternalOption(opt);
    if (this._first) {
      this.onNotify(internalOpt);
      this._first = false;
    } else if (
      internalOpt.stateMutations.length > 0 ||
      internalOpt.exposedMutations.length > 0
    ) {
      this.onNotify(internalOpt);
    }
  }
  protected async notifyAndPause(opt: NotifyOption = {}) {
    this.notify(opt);
    const internalPauseOpt = this.createPauseInternalOption(opt);
    await this.onPause(internalPauseOpt);
  }

  /**
   * 当上层调用 `StateMutator.prototype.notify` 时，调用的接口。
   * 子类重写此接口以实现提示功能
   */
  protected abstract onNotify(opt: InternalNotifyOption): void;
  protected abstract onPause(opt: InternalPauseOption): Promise<void>;

  protected drawCard(who: 0 | 1): CardState | null {
    const candidate = this.state.players[who].piles[0];
    if (typeof candidate === "undefined") {
      return null;
    }
    this.mutate({
      type: "transferCard",
      who,
      from: "piles",
      to: "hands",
      value: candidate,
    });
    if (this.state.players[who].hands.length > this.state.config.maxHands) {
      this.mutate({
        type: "removeCard",
        who,
        where: "hands",
        oldState: candidate,
        used: false,
      });
    }
    return candidate;
  }

  protected async requestSwitchCard(who: 0 | 1): Promise<number[]> {
    throw new GiTcgIoNotProvideError();
  }
  protected async requestReroll(who: 0 | 1): Promise<number[]> {
    throw new GiTcgIoNotProvideError();
  }
  protected async requestSelectCard(
    who: 0 | 1,
    cards: readonly number[],
  ): Promise<number> {
    throw new GiTcgIoNotProvideError();
  }

  protected async switchCard(who: 0 | 1) {
    const removedHands = await this.requestSwitchCard(who);
    const player = () => this.state.players[who];
    // swapIn: 从手牌到牌堆
    // swapOut: 从牌堆到手牌
    const count = removedHands.length;
    const swapInCards = removedHands.map((id) => {
      const card = player().hands.find((c) => c.id === id);
      if (typeof card === "undefined") {
        throw new GiTcgDataError(`Unknown card id ${id}`);
      }
      return card;
    });
    const swapInCardIds = swapInCards.map((c) => c.definition.id);

    for (const card of swapInCards) {
      const mutation: Mutation = {
        type: "stepRandom",
        value: -1,
      };
      this.mutate(mutation);
      const index = mutation.value % (player().piles.length + 1);
      this.mutate({
        type: "transferCard",
        from: "hands",
        to: "piles",
        who,
        value: card,
        targetIndex: index,
      });
    }
    // 如果牌堆顶的手牌是刚刚换入的同名牌，那么暂时不选它
    let topIndex = 0;
    for (let i = 0; i < count; i++) {
      let candidate: CardState;
      while (
        topIndex < player().piles.length &&
        swapInCardIds.includes(player().piles[topIndex].definition.id)
      ) {
        topIndex++;
      }
      if (topIndex >= player().piles.length) {
        // 已经跳过了所有同名牌，只能从头开始
        candidate = player().piles[0];
      } else {
        candidate = player().piles[topIndex];
      }
      this.mutate({
        type: "transferCard",
        from: "piles",
        to: "hands",
        who,
        value: candidate,
      });
    }
    this.notify();
  }

  protected randomDice(
    count: number,
    alwaysOmni?: boolean,
  ): readonly DiceType[] {
    if (alwaysOmni) {
      return new Array<DiceType>(count).fill(DiceType.Omni);
    }
    const mut: StepRandomM = {
      type: "stepRandom",
      value: 0,
    };
    const result: DiceType[] = [];
    for (let i = 0; i < count; i++) {
      this.mutate(mut);
      result.push((mut.value % 8) + 1);
    }
    return result;
  }

  protected async reroll(who: 0 | 1, times: number) {
    for (let i = 0; i < times; i++) {
      const dice = this.state.players[who].dice;
      const rerollIndexes = await this.requestReroll(who);
      if (rerollIndexes.length === 0) {
        return;
      }
      const controlled: DiceType[] = [];
      for (let k = 0; k < dice.length; k++) {
        if (!rerollIndexes.includes(k)) {
          controlled.push(dice[k]);
        }
      }
      this.mutate({
        type: "resetDice",
        who,
        value: sortDice(this.state.players[who], [
          ...controlled,
          ...this.randomDice(rerollIndexes.length),
        ]),
      });
      this.notify();
    }
  }

  protected async selectCard(
    who: 0 | 1,
    info: SelectCardInfo,
  ): Promise<EventAndRequest[]> {
    const selected = await this.requestSelectCard(
      who,
      info.cards.map((def) => def.id),
    );
    switch (info.type) {
      case "createHandCard": {
        const def = this.state.data.cards.get(selected);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(`Unknown card definition id ${selected}`);
        }
        this.createHandCardImpl(who, def);
        return [];
      }
      case "createEntity": {
        const def = this.state.data.entities.get(selected);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(`Unknown card definition id ${selected}`);
        }
        if (def.type !== "summon") {
          throw new GiTcgDataError(`Entity type ${def.type} not supported now`);
        }
        const entityArea: EntityArea = {
          who,
          type: "summons",
        };
        const { oldState, newState } = this.createEntityImpl(def, entityArea);
        if (newState) {
          const enterInfo = {
            overridden: oldState,
            newState,
          };
          return [["onEnter", new EnterEventArg(this.state, enterInfo)]];
        } else {
          return [];
        }
      }
      default: {
        const _: never = info;
        throw new GiTcgDataError(`Not recognized selectCard type`);
      }
    }
  }

  protected createHandCardImpl(who: 0 | 1, definition: CardDefinition) {
    using l = this.subLog(
      DetailLogType.Primitive,
      `Create hand card [card:${definition.id}]`,
    );
    const cardState: CardState = {
      id: 0,
      definition,
    };
    this.mutate({
      type: "createCard",
      who,
      target: "hands",
      value: cardState,
    });
    const player = this.state.players[who];
    if (player.hands.length > this.state.config.maxHands) {
      this.mutate({
        type: "removeCard",
        who,
        where: "hands",
        oldState: cardState,
        used: false,
      });
    }
  }

  protected createEntityImpl(
    def: EntityDefinition,
    area: EntityArea,
    opt: CreateEntityOptions = {},
  ): CreateEntityResult {
    using l = this.subLog(
      DetailLogType.Primitive,
      `Create entity [${def.type}:${def.id}] at ${stringifyEntityArea(area)}`,
    );
    const entitiesAtArea = allEntitiesAtArea(this.state, area);
    // handle immuneControl vs disableSkill;
    // do not generate Frozen etc. on those characters
    const immuneControl = entitiesAtArea.find(
      (e) =>
        e.definition.type === "status" &&
        e.definition.tags.includes("immuneControl"),
    );
    if (
      immuneControl &&
      def.type === "status" &&
      def.tags.includes("disableSkill")
    ) {
      this.log(
        DetailLogType.Other,
        "Because of immuneControl, entities with disableSkill cannot be created",
      );
      return { oldState: null, newState: null };
    }
    const oldState = entitiesAtArea.find(
      (e): e is EntityState =>
        e.definition.type !== "character" &&
        e.definition.type !== "support" &&
        e.definition.id === def.id,
    );
    const { varConfigs } = def;
    const overrideVariables = opt.overrideVariables ?? {};
    if (oldState) {
      this.log(
        DetailLogType.Other,
        `Found existing entity ${stringifyState(
          oldState,
        )} at same area. Rewriting variables`,
      );
      const newValues: Record<string, number> = {};
      // refresh exist entity's variable
      for (const name in varConfigs) {
        let { initialValue, recreateBehavior } = varConfigs[name];
        if (typeof overrideVariables[name] === "number") {
          initialValue = overrideVariables[name]!;
        }
        const oldValue = oldState.variables[name] ?? 0;
        switch (recreateBehavior.type) {
          case "overwrite": {
            newValues[name] = initialValue;
            break;
          }
          case "takeMax": {
            newValues[name] = Math.max(initialValue, oldValue ?? 0);
            break;
          }
          case "append": {
            const appendValue =
              overrideVariables[name] ?? recreateBehavior.appendValue;
            const appendResult = appendValue + oldValue;
            newValues[name] = Math.min(
              appendResult,
              recreateBehavior.appendLimit,
            );
          }
        }
      }
      for (const [name, value] of Object.entries(newValues)) {
        if (Reflect.has(oldState.variables, name)) {
          this.mutate({
            type: "modifyEntityVar",
            state: oldState,
            varName: name,
            value,
          });
        }
      }
      const newState = getEntityById(this.state, oldState.id);
      return { oldState, newState };
    } else {
      if (
        area.type === "summons" &&
        entitiesAtArea.length === this.state.config.maxSummons
      ) {
        return { oldState: null, newState: null };
      }
      const initState: EntityState = {
        id: opt.withId ?? 0,
        definition: def,
        variables: Object.fromEntries(
          Object.entries(varConfigs).map(([name, { initialValue }]) => [
            name,
            overrideVariables[name] ?? initialValue,
          ]),
        ),
      };
      this.mutate({
        type: "createEntity",
        where: area,
        value: initState,
      });
      const newState = getEntityById(this.state, initState.id);
      return { oldState: null, newState };
    }
  }
}
