// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DamageType, DiceType } from "@gi-tcg/typings";
import { registerSkill } from "./registry";
import {
  CommonSkillType,
  SkillDescription,
  SkillType,
  EventNames,
  SkillInfo,
  TriggeredSkillDefinition,
  TriggeredSkillFilter,
  PlayCardInfo,
  SwitchActiveInfo,
  UseSkillInfo,
  EventArgOf,
  ModifyActionEventArg,
  ActionEventArg,
  DamageInfo,
  SkillResult,
  ElementalTuningInfo,
} from "../base/skill";
import { EntityVariables, GameState } from "../base/state";
import { ContextMetaBase, SkillContext, TypedSkillContext } from "./context";
import { ExtensionHandle, SkillHandle } from "./type";
import {
  EntityArea,
  USAGE_PER_ROUND_VARIABLE_NAMES,
  UsagePerRoundVariableNames,
} from "../base/entity";
import { EntityBuilder, EntityBuilderResultT, VariableOptions } from "./entity";
import { getEntityArea, isCharacterInitiativeSkill } from "../utils";
import { GiTcgCoreInternalError, GiTcgDataError } from "../error";
import { createVariable } from "./utils";

export type BuilderMetaBase = Omit<ContextMetaBase, "readonly">;
export type ReadonlyMetaOf<BM extends BuilderMetaBase> = {
  [K in keyof BuilderMetaBase]: BM[K];
} & { readonly: true };
export type WritableMetaOf<BM extends BuilderMetaBase> = {
  [K in keyof BuilderMetaBase]: BM[K];
} & { readonly: false };

export type SkillOperation<Meta extends BuilderMetaBase> = (
  c: TypedSkillContext<WritableMetaOf<Meta>>,
  e: Omit<Meta["eventArgType"], `_${string}`>,
) => void;

export type SkillFilter<Meta extends BuilderMetaBase> = (
  c: TypedSkillContext<ReadonlyMetaOf<Meta>>,
  e: Omit<Meta["eventArgType"], `_${string}`>,
) => unknown;

enum ListenTo {
  Myself,
  SameArea,
  SamePlayer,
  All,
}

interface RelativeArg {
  callerId: number;
  callerArea: EntityArea;
  listenTo: ListenTo;
}

function checkRelative(
  state: GameState,
  entityIdOrWhoIntf: number | { who: 0 | 1 },
  r: RelativeArg,
): boolean {
  if (typeof entityIdOrWhoIntf === "number") {
    const entityArea = getEntityArea(state, entityIdOrWhoIntf);
    switch (r.listenTo) {
      case ListenTo.Myself:
        return r.callerId === entityIdOrWhoIntf;
      // @ts-expect-error fallthrough
      case ListenTo.SameArea:
        if (r.callerArea.type === "characters") {
          return (
            entityArea.type === "characters" &&
            r.callerArea.characterId === entityArea.characterId
          );
        }
      case ListenTo.SamePlayer:
        return r.callerArea.who === entityArea.who;
      case ListenTo.All:
        return true;
      default:
        const _: never = r.listenTo;
        throw new GiTcgDataError(`Unknown listenTo: ${_}`);
    }
  } else {
    if (r.listenTo === ListenTo.All) {
      return true;
    } else {
      return r.callerArea.who === entityIdOrWhoIntf.who;
    }
  }
}

type Descriptor<E extends EventNames> = readonly [
  E,
  (
    c: TypedSkillContext<
      Omit<ContextMetaBase, "eventArgType"> & { eventArgType: EventArgOf<E> }
    >,
    e: EventArgOf<E>,
    listen: RelativeArg,
  ) => boolean,
];

function defineDescriptor<E extends EventNames>(
  name: E,
  filter?: Descriptor<E>[1],
): Descriptor<E> {
  return [name, filter ?? ((e) => true)];
}

/**
 * 检查此技能使用是否适用于通常意义上的“使用技能后”。
 *
 * 通常意义上的使用技能后是指：
 * 1. 该技能为主动技能；且
 * 2. 该技能不是准备技能触发的。
 * 3. Note: 通过使用卡牌（天赋等）触发的技能也适用。
 */
function commonInitiativeSkillCheck(skillInfo: SkillInfo): boolean {
  // 主动技能且并非卡牌描述
  if (isCharacterInitiativeSkill(skillInfo.definition)) {
    // 准备技能不触发
    if (skillInfo.requestBy?.definition.triggerOn === "replaceAction") {
      return false;
    }
    return true;
  }
  return false;
}

function isDebuff(state: GameState, damageInfo: DamageInfo): boolean {
  return (
    getEntityArea(state, damageInfo.source.id).who ===
    getEntityArea(state, damageInfo.target.id).who
  );
}

/**
 * 定义数据描述中的触发事件名。
 *
 * 系统内部的事件名数量较少，
 * 提供给数据描述的事件名可解释为内部事件+筛选条件。
 * 比如 `onDamaged` 可解释为 `onDamage` 发生且伤害目标
 * 在监听范围内。
 */
const detailedEventDictionary = {
  roll: defineDescriptor("modifyRoll", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  modifyAction: defineDescriptor("modifyAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  deductDice: defineDescriptor("modifyAction", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r) && e.canDeductCost();
  }),
  deductDiceSwitch: defineDescriptor("modifyAction", (c, e, r) => {
    return (
      checkRelative(c.state, { who: e.who }, r) &&
      e.isSwitchActive() &&
      e.canDeductCost()
    );
  }),
  deductDiceCard: defineDescriptor("modifyAction", (c, e, r) => {
    return (
      checkRelative(c.state, { who: e.who }, r) &&
      e.isPlayCard() &&
      e.canDeductCost()
    );
  }),
  deductDiceSkill: defineDescriptor("modifyAction", (c, e, r) => {
    return (
      e.isUseSkill() &&
      checkRelative(c.state, e.action.skill.caller.id, r) &&
      e.canDeductCost()
    );
  }),
  beforeFastSwitch: defineDescriptor("modifyAction", (c, e, r) => {
    return (
      checkRelative(c.state, { who: e.who }, r) &&
      e.isSwitchActive() &&
      !e.isFast()
    );
  }),
  modifyDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return checkRelative(c.state, e.source.id, r);
  }),
  modifySkillDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(c.state, e.source.id, r) &&
      commonInitiativeSkillCheck(e.via) &&
      e.damageInfo.fromReaction === null
    );
  }),
  modifyDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(c.state, e.source.id, r) &&
      !isDebuff(c.state, e.damageInfo)
    );
  }),
  modifySkillDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(c.state, e.source.id, r) &&
      commonInitiativeSkillCheck(e.via) &&
      e.damageInfo.fromReaction === null
    );
  }),
  beforeDamaged: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing && checkRelative(c.state, e.target.id, r)
    );
  }),
  beforeDefeated: defineDescriptor("modifyZeroHealth", (c, e, r) => {
    return checkRelative(c.state, e.target.id, r) && e._immuneInfo === null;
  }),

  battleBegin: defineDescriptor("onBattleBegin"),
  roundBegin: defineDescriptor("onRoundBegin"),
  actionPhase: defineDescriptor("onActionPhase"),
  endPhase: defineDescriptor("onEndPhase"),
  beforeAction: defineDescriptor("onBeforeAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  replaceAction: defineDescriptor("replaceAction"),
  action: defineDescriptor("onAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  playCard: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r) && e.isPlayCard();
  }),
  useSkill: defineDescriptor("onAction", (c, e, r) => {
    return (
      e.isUseSkill() && checkRelative(c.state, e.action.skill.caller.id, r)
    );
  }),
  declareEnd: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r) && e.isDeclareEnd();
  }),
  switchActive: defineDescriptor("onSwitchActive", (c, e, r) => {
    return (
      checkRelative(c.state, e.switchInfo.from.id, r) ||
      checkRelative(c.state, e.switchInfo.to.id, r)
    );
  }),
  drawCards: defineDescriptor("onDrawCards", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r);
  }),
  disposeCard: defineDescriptor("onDisposeOrTuneCard", (c, e, r) => {
    return (
      e.method !== "elementalTuning" &&
      checkRelative(c.state, { who: e.who }, r)
    );
  }),
  disposeOrTuneCard: defineDescriptor("onDisposeOrTuneCard", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r);
  }),
  dealDamage: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return e.isDamageTypeDamage() && checkRelative(c.state, e.source.id, r);
  }),
  skillDamage: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return (
      e.isDamageTypeDamage() &&
      checkRelative(c.state, e.source.id, r) &&
      commonInitiativeSkillCheck(e.damageInfo.via)
    );
  }),
  damaged: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return e.isDamageTypeDamage() && checkRelative(c.state, e.target.id, r);
  }),
  healed: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return e.isDamageTypeHeal() && checkRelative(c.state, e.target.id, r);
  }),
  damagedOrHealed: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return checkRelative(c.state, e.target.id, r);
  }),
  reaction: defineDescriptor("onReaction", (c, e, r) => {
    return checkRelative(c.state, e.reactionInfo.target.id, r);
  }),
  enter: defineDescriptor("onEnter", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  enterRelative: defineDescriptor("onEnter", (c, e, r) => {
    return checkRelative(c.state, e.entity.id, r);
  }),
  dispose: defineDescriptor("onDispose", (c, e, r) => {
    return checkRelative(c.state, e.entity.id, r);
  }),
  selfDispose: defineDescriptor("onDispose", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  defeated: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return checkRelative(c.state, e.target.id, r) && e.damageInfo.causeDefeated;
  }),
  revive: defineDescriptor("onRevive", (c, e, r) => {
    return checkRelative(c.state, e.character.id, r);
  }),
  transformDefinition: defineDescriptor("onTransformDefinition", (c, e, r) => {
    return checkRelative(c.state, e.entity.id, r);
  }),
} satisfies Record<string, Descriptor<any>>;

type OverrideEventArgType = {
  deductDiceSwitch: ModifyActionEventArg<SwitchActiveInfo>;
  deductDiceCard: ModifyActionEventArg<PlayCardInfo>;
  deductDiceSkill: ModifyActionEventArg<UseSkillInfo>;
  playCard: ActionEventArg<PlayCardInfo>;
  useSkill: ActionEventArg<UseSkillInfo>;
  elementalTuning: ActionEventArg<ElementalTuningInfo>;
};

type DetailedEventDictionary = typeof detailedEventDictionary;
export type DetailedEventNames = keyof DetailedEventDictionary;
export type DetailedEventArgOf<E extends DetailedEventNames> =
  E extends keyof OverrideEventArgType
    ? OverrideEventArgType[E]
    : EventArgOf<DetailedEventDictionary[E][0]>;

export type SkillInfoGetter = () => SkillInfo;

const BUILDER_META_TYPE: unique symbol = Symbol();

export abstract class SkillBuilder<Meta extends BuilderMetaBase> {
  declare [BUILDER_META_TYPE]: Meta;

  protected operations: SkillOperation<Meta>[] = [];
  protected associatedExtensionId: number | undefined = void 0;
  constructor(protected readonly id: number) {}
  protected applyFilter = false;
  protected _filter: SkillFilter<Meta> = () => true;

  if(filter: SkillFilter<Meta>): this {
    this._filter = filter;
    this.applyFilter = true;
    return this;
  }

  do(op: SkillOperation<Meta>): this {
    if (this.applyFilter) {
      const ifFilter = this._filter;
      this.operations.push((c, e) => {
        if (!ifFilter(c as any, e)) return;
        return op(c, e);
      });
    } else {
      this.operations.push(op);
    }
    this.applyFilter = false;
    return this;
  }

  else(): this {
    const ifFilter = this._filter;
    this._filter = (c, e) => !ifFilter(c, e);
    this.applyFilter = true;
    return this;
  }

  /**
   * 在 `state` 上，以 `skillInfo` `arg` 应用技能描述
   *
   * @returns 即 `SkillDescription` 的返回值
   */
  protected applyActions(
    state: GameState,
    skillInfo: SkillInfo,
    arg: Meta["eventArgType"],
  ): SkillResult {
    const ctx = new SkillContext<WritableMetaOf<Meta>>(
      state,
      { ...skillInfo, associatedExtensionId: this.associatedExtensionId },
      arg,
    );
    for (const op of this.operations) {
      op(ctx, ctx.eventArg);
    }
    ctx._terminate();
    return [ctx.state, ctx.events] as const;
  }
}

// 找到所有返回 void 的方法
type AvailablePropImpl<
  Obj extends object,
  K extends keyof Obj,
> = Obj[K] extends (...args: any[]) => void
  ? ReturnType<Obj[K]> extends void
    ? K
    : never
  : never;
type AvailablePropOf<Ctx extends object> = {
  [K in keyof Ctx]: AvailablePropImpl<Ctx, K>;
}[keyof Ctx];

type SkillContextShortCutSource<Meta extends ContextMetaBase> =
  TypedSkillContext<Omit<Meta, "readonly"> & { readonly: false }> &
    Omit<Meta["eventArgType"], `_${string}`>;

type SkillContextShortcutProps<Meta extends ContextMetaBase> = AvailablePropOf<
  SkillContextShortCutSource<Meta>
>;

// 所有返回 void 的方法的参数类型
type SkillContextShortcutArgs<
  Meta extends ContextMetaBase,
  K extends keyof SkillContextShortCutSource<Meta>,
> = SkillContextShortCutSource<Meta>[K] extends (...args: infer Args) => void
  ? Args
  : never;

// 带有直达方法的 Builder，使用 `enableShortcut` 生成
export type BuilderWithShortcut<Original> = Original & {
  [K in SkillContextShortcutProps<WritableMetaOf<ExtractBM<Original>>>]: (
    ...args: SkillContextShortcutArgs<WritableMetaOf<ExtractBM<Original>>, K>
  ) => BuilderWithShortcut<Original>;
};

type ExtractBM<T> = T extends {
  [BUILDER_META_TYPE]: infer Meta extends BuilderMetaBase;
}
  ? Meta
  : never;

/**
 * 为 Builder 添加直达 SkillContext 的函数，即可
 * `.do((c) => c.PROP(ARGS))`
 * 直接简写为
 * `.PROP(ARGS)`
 */
export function enableShortcut<T extends SkillBuilder<any>>(
  original: T,
): BuilderWithShortcut<T> {
  const proxy = new Proxy(original, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      } else if (prop in SkillContext.prototype) {
        return function (this: T, ...args: any[]) {
          return this.do((c) => (c as any)[prop](...args));
        };
      } else {
        return function (this: T, ...args: any[]) {
          return this.do((c) => c.eventArg[prop](...args));
        };
      }
    },
  });
  return proxy as any;
}

interface UsageOptions<Name extends string> extends VariableOptions {
  name?: Name;
  /** 是否为“每回合使用次数”。默认值为 `false`。 */
  perRound?: boolean;
  /** 是否在每次技能执行完毕后自动 -1。默认值为 `true`。 */
  autoDecrease?: boolean;
  /** 是否在扣除到 0 后自动弃置实体，默认值为 `true` */
  autoDispose?: boolean;
}

export class TriggeredSkillBuilder<
  Meta extends BuilderMetaBase,
  EventName extends DetailedEventNames,
> extends SkillBuilder<Meta> {
  private _triggerFilter: SkillFilter<Meta>;
  constructor(
    id: number,
    private readonly triggerOn: EventName,
    private readonly parent: EntityBuilder<
      Meta["callerType"],
      Meta["callerVars"],
      Meta["associatedExtension"]
    >,
    triggerFilter: SkillFilter<Meta> = () => true,
  ) {
    super(id);
    this.associatedExtensionId = this.parent._associatedExtensionId;
    const [, filterDescriptor] = detailedEventDictionary[this.triggerOn];
    this._triggerFilter = (c, e) => {
      const { area, state } = c.self;
      return (
        filterDescriptor(c as any, e as any, {
          callerArea: area,
          callerId: state.id,
          listenTo: this._listenTo,
        }) && triggerFilter(c, e)
      );
    };
  }
  private _usageOpt: { name: string; autoDecrease: boolean } | null = null;
  private _usagePerRoundOpt: {
    name: UsagePerRoundVariableNames;
    autoDecrease: boolean;
  } | null = null;
  private _listenTo: ListenTo = ListenTo.SameArea;

  /**
   * 为实体创建名为 `usage` 的变量，表示剩余使用次数。
   * 在每次技能执行完毕后，若该变量计数达到 0，则不会触发操作。
   *
   * 若 `autoDispose` 且非 `perRound`（默认），则同时会弃置实体。
   * @param count
   * @param opt @see UsageOptions
   * @returns
   */
  usage<VarName extends string = "usage">(
    count: number,
    opt?: UsageOptions<VarName>,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      {
        callerType: Meta["callerType"];
        callerVars: Meta["callerVars"] | VarName;
        eventArgType: Meta["eventArgType"];
        associatedExtension: Meta["associatedExtension"];
      },
      EventName
    >
  > {
    const perRound = opt?.perRound ?? false;
    const autoDecrease = opt?.autoDecrease ?? true;
    let name: string;
    if (opt?.name) {
      name = opt.name;
    } else {
      if (this.parent._type === "character") {
        throw new GiTcgDataError(
          `You must explicitly set the name of usage when defining passive skill. Be careful that different passive skill should have distinct usage name.`,
        );
      }
      if (perRound) {
        if (
          this.parent._usagePerRoundIndex >=
          USAGE_PER_ROUND_VARIABLE_NAMES.length
        ) {
          throw new GiTcgCoreInternalError(
            `Cannot specify more than ${USAGE_PER_ROUND_VARIABLE_NAMES.length} usagePerRound.`,
          );
        }
        name = USAGE_PER_ROUND_VARIABLE_NAMES[this.parent._usagePerRoundIndex];
        this.parent._usagePerRoundIndex++;
      } else {
        name = "usage";
      }
    }
    if (perRound) {
      if (this._usagePerRoundOpt !== null) {
        throw new GiTcgDataError("Cannot specify usagePerRound twice.");
      }
      this._usagePerRoundOpt = { name: name as any, autoDecrease };
    } else {
      if (this._usageOpt !== null) {
        throw new GiTcgDataError("Cannot specify usage twice.");
      }
      this._usageOpt = { name, autoDecrease };
    }
    const autoDispose = name === "usage" && opt?.autoDispose !== false;
    this.parent.variable(name, count, opt);
    if (autoDispose) {
      this.parent._varConfigs.disposeWhenUsageIsZero = createVariable(1);
    }
    // 增加“检查可用次数”的技能触发条件
    const oldFilter = this._triggerFilter;
    this._triggerFilter = (c, e) => {
      if (!oldFilter(c, e)) return false;
      return c.getVariable(name) > 0;
    };
    return this as any;
  }
  /**
   * Same as
   * ```
   *   .usage(count, { ...opt, perRound: true, visible: false })
   * ```
   */
  usagePerRound<VarName extends UsagePerRoundVariableNames = "usagePerRound">(
    count: number,
    opt?: Omit<UsageOptions<VarName>, "perRound">,
  ) {
    return this.usage<VarName>(count, {
      ...opt,
      perRound: true,
      visible: false,
    });
  }
  usageCanAppend<VarName extends string = "usage">(
    count: number,
    appendLimit?: number,
    appendValue?: number,
  ) {
    return this.usage<VarName>(count, {
      append: { limit: appendLimit, value: appendValue },
    });
  }

  private listenToMySelf(): this {
    this._listenTo = ListenTo.Myself;
    return this;
  }

  listenToPlayer(): this {
    this._listenTo = ListenTo.SamePlayer;
    return this;
  }

  listenToAll(): this {
    this._listenTo = ListenTo.All;
    return this;
  }

  private buildSkill() {
    if (this._usagePerRoundOpt?.autoDecrease) {
      this.do((c) => {
        c.consumeUsagePerRound();
      });
    }
    if (this._usageOpt?.autoDecrease) {
      if (this._usageOpt.name === "usage") {
        // 若变量名为 usage，则消耗可用次数时可能调用 c.dispose
        // 使用 consumeUsage 方法实现相关操作
        this.do((c) => {
          c.consumeUsage();
        });
      } else {
        // 否则手动扣除使用次数
        const name = this._usageOpt.name;
        this.do((c) => {
          c.addVariable(name, -1);
        });
      }
    }
    const [eventName] = detailedEventDictionary[this.triggerOn];
    const filter: TriggeredSkillFilter<any> = (state, skillInfo, arg) => {
      const ctx = new SkillContext(state, skillInfo, arg);
      return !!this._triggerFilter(ctx as any, arg);
    };
    const action: SkillDescription<any> = (state, skillInfo, arg) => {
      return this.applyActions(state, skillInfo, arg as any);
    };
    const def: TriggeredSkillDefinition = {
      __definition: "skills",
      type: "skill",
      skillType: null,
      id: this.id,
      triggerOn: eventName,
      requiredCost: [],
      gainEnergy: false,
      filter,
      action,
      usagePerRoundVariableName: this._usagePerRoundOpt?.name ?? null,
    };
    registerSkill(def);
    this.parent._skillList.push(def);
  }

  endOn() {
    this.buildSkill();
    return this.parent;
  }
  on<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<{
      eventArgType: DetailedEventArgOf<E>;
      callerType: Meta["callerType"];
      callerVars: Meta["callerVars"];
      associatedExtension: Meta["associatedExtension"];
    }>,
  ) {
    this.buildSkill();
    return this.parent.on(event, filter);
  }
  once<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<{
      eventArgType: DetailedEventArgOf<E>;
      callerType: Meta["callerType"];
      callerVars: Meta["callerVars"];
      associatedExtension: Meta["associatedExtension"];
    }>,
  ) {
    this.buildSkill();
    return this.parent.once(event, filter);
  }

  done(): EntityBuilderResultT<Meta["callerType"]> {
    this.buildSkill();
    return this.parent.done();
  }
}

export abstract class SkillBuilderWithCost<
  EventArg,
  AssociatedExt extends ExtensionHandle,
> extends SkillBuilder<{
  callerType: "character";
  callerVars: never;
  eventArgType: EventArg;
  associatedExtension: AssociatedExt;
}> {
  constructor(skillId: number) {
    super(skillId);
  }
  protected _cost: DiceType[] = [];
  private cost(type: DiceType, count: number): this {
    this._cost.push(...Array(count).fill(type));
    return this;
  }
  costVoid(count: number) {
    return this.cost(DiceType.Void, count);
  }
  costCryo(count: number) {
    return this.cost(DiceType.Cryo, count);
  }
  costHydro(count: number) {
    return this.cost(DiceType.Hydro, count);
  }
  costPyro(count: number) {
    return this.cost(DiceType.Pyro, count);
  }
  costElectro(count: number) {
    return this.cost(DiceType.Electro, count);
  }
  costAnemo(count: number) {
    return this.cost(DiceType.Anemo, count);
  }
  costGeo(count: number) {
    return this.cost(DiceType.Geo, count);
  }
  costDendro(count: number) {
    return this.cost(DiceType.Dendro, count);
  }
  costSame(count: number) {
    return this.cost(DiceType.Same, count);
  }
  costEnergy(count: number) {
    return this.cost(DiceType.Energy, count);
  }
}

class InitiativeSkillBuilder<
  AssociatedExt extends ExtensionHandle,
> extends SkillBuilderWithCost<void, AssociatedExt> {
  private _skillType: SkillType = "normal";
  private _gainEnergy = true;
  protected _cost: DiceType[] = [];
  constructor(private readonly skillId: number) {
    super(skillId);
  }
  associateExtension<NewExtT>(ext: ExtensionHandle<NewExtT>) {
    if (typeof this.associatedExtensionId !== "undefined") {
      throw new GiTcgDataError(
        `This skill has already associated with extension ${this.id}`,
      );
    }
    this.associatedExtensionId = ext;
    return this as unknown as InitiativeSkillBuilder<ExtensionHandle<NewExtT>>;
  }

  noEnergy(): this {
    this._gainEnergy = false;
    return this;
  }

  type(type: "passive"): EntityBuilder<"character">;
  type(type: CommonSkillType): this;
  type(type: CommonSkillType | "passive"): any {
    if (type === "passive") {
      return new EntityBuilder("character", this.skillId);
    }
    if (type === "burst") {
      this._gainEnergy = false;
    }
    this._skillType = type;
    return this;
  }

  /** 此定义未被使用。 */
  reserve(): void {}

  done(): SkillHandle {
    const action: SkillDescription<void> = (state, skillInfo) => {
      return this.applyActions(state, skillInfo, void 0);
    };
    registerSkill({
      __definition: "skills",
      type: "skill",
      skillType: this._skillType,
      id: this.skillId,
      triggerOn: null,
      requiredCost: this._cost,
      gainEnergy: this._gainEnergy,
      action,
    });
    return this.skillId as SkillHandle;
  }
}

export function skill(id: number) {
  return enableShortcut(new InitiativeSkillBuilder(id));
}
