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
} from "../base/skill";
import { CharacterState, EntityState, GameState } from "../base/state";
import { ContextMetaBase, SkillContext, TypedSkillContext } from "./context";
import { SkillHandle } from "./type";
import { EntityArea, ExEntityType } from "../base/entity";
import { EntityBuilder, EntityBuilderResultT, VariableOptions } from "./entity";
import { getEntityArea } from "../util";
import { GiTcgDataError } from "../error";

export type BuilderMetaBase = Omit<ContextMetaBase, "readonly">;
export type ReadonlyMetaOf<BM extends BuilderMetaBase> = {
  [K in keyof BuilderMetaBase]: BM[K];
} & { readonly: true };
export type WritableMetaOf<BM extends BuilderMetaBase> = {
  [K in keyof BuilderMetaBase]: BM[K];
} & { readonly: false };

type SkillOperation<Meta extends BuilderMetaBase> = (
  c: TypedSkillContext<WritableMetaOf<Meta>>,
  e: Meta["eventArgType"],
) => void;

export type SkillFilter<Meta extends BuilderMetaBase> = (
  c: TypedSkillContext<ReadonlyMetaOf<Meta>>,
  e: Meta["eventArgType"],
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
  if (
    skillInfo.definition.triggerOn === null &&
    skillInfo.definition.skillType !== "card"
  ) {
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
      checkRelative(c.state, { who: e.who }, r) &&
      e.isUseSkill() &&
      e.canDeductCost()
    );
  }),
  deductDiceSkillOrTalent: defineDescriptor("modifyAction", (c, e, r) => {
    if (e.action.type === "useSkill") {
      return checkRelative(c.state, e.action.skill.caller.id, r);
    } else if (
      e.action.type === "playCard" &&
      e.action.card.definition.tags.includes("talent")
    ) {
      return checkRelative(c.state, { who: e.who }, r);
    } else {
      return false;
    }
  }),
  beforeFastSwitch: defineDescriptor("modifyAction", (c, e, r) => {
    return (
      checkRelative(c.state, { who: e.who }, r) &&
      e.isSwitchActive() &&
      !e.isFast()
    );
  }),
  modifyDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return checkRelative(c.state, e.damageInfo.source.id, r);
  }),
  modifySkillDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return (
      e.damageInfo.type !== DamageType.Piercing &&
      checkRelative(c.state, e.damageInfo.source.id, r) &&
      commonInitiativeSkillCheck(e.damageInfo.via)
    );
  }),
  modifyDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.damageInfo.type !== DamageType.Piercing &&
      checkRelative(c.state, e.damageInfo.source.id, r) &&
      !isDebuff(c.state, e.damageInfo)
    );
  }),
  modifySkillDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.damageInfo.type !== DamageType.Piercing &&
      checkRelative(c.state, e.damageInfo.source.id, r) &&
      commonInitiativeSkillCheck(e.damageInfo.via)
    );
  }),
  beforeDamaged: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.damageInfo.type !== DamageType.Piercing &&
      checkRelative(c.state, e.damageInfo.target.id, r)
    );
  }),
  beforeDefeated: defineDescriptor("modifyZeroHealth", (c, e, r) => {
    return checkRelative(c.state, e.character.id, r) && e._immuneInfo === null;
  }),

  battleBegin: defineDescriptor("onBattleBegin"),
  actionPhase: defineDescriptor("onActionPhase"),
  endPhase: defineDescriptor("onEndPhase"),
  beforeAction: defineDescriptor("onBeforeAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  replaceAction: defineDescriptor("replaceAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  action: defineDescriptor("onAction", (c, { who }, r) => {
    return checkRelative(c.state, { who }, r);
  }),
  playCard: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r) && e.isPlayCard();
  }),
  useSkill: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(c.state, { who: e.who }, r) && e.isUseSkill();
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
  dealDamage: defineDescriptor("onDamage", (c, e, r) => {
    return checkRelative(c.state, e.source.id, r);
  }),
  damaged: defineDescriptor("onDamage", (c, e, r) => {
    return checkRelative(c.state, e.target.id, r);
  }),
  healed: defineDescriptor("onHeal", (c, e, r) => {
    return checkRelative(c.state, e.healInfo.target.id, r);
  }),
  reaction: defineDescriptor("onReaction", (c, e, r) => {
    return checkRelative(c.state, e.reactionInfo.target.id, r);
  }),
  enter: defineDescriptor("onEnter", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  dispose: defineDescriptor("onDispose", (c, e, r) => {
    return checkRelative(c.state, e.entity.id, r);
  }),
  selfDispose: defineDescriptor("onDispose", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  defeated: defineDescriptor("onDefeated", (c, e, r) => {
    return checkRelative(c.state, e.character.id, r);
  }),
  revive: defineDescriptor("onRevive", (c, e, r) => {
    return checkRelative(c.state, e.character.id, r);
  }),
  replaceCharacterDefinition: defineDescriptor(
    "onReplaceCharacterDefinition",
    (c, e, r) => {
      return checkRelative(c.state, e.character.id, r);
    },
  ),
} satisfies Record<string, Descriptor<any>>;

type OverrideEventArgType = {
  deductDiceSwitch: ModifyActionEventArg<SwitchActiveInfo>;
  deductDiceCard: ModifyActionEventArg<PlayCardInfo>;
  deductDiceSkill: ModifyActionEventArg<UseSkillInfo>;
  deductDiceSkillOrTalent: ModifyActionEventArg<UseSkillInfo | PlayCardInfo>;
  playCard: ActionEventArg<PlayCardInfo>;
  useSkill: ActionEventArg<UseSkillInfo>;
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
   * 生成内部技能描述函数。
   * 给定两个参数：它们接受 `SkillContext` 然后转换到对应扩展点。
   * 这些参数将传递给用户。
   * @param extGenerator 生成扩展点的函数
   * @returns 内部技能描述函数
   */
  protected getAction(arg: Meta["eventArgType"]): SkillDescription<void> {
    return (state, skillInfo) => {
      const ctx = new SkillContext<WritableMetaOf<Meta>>(state, skillInfo, arg);
      for (const op of this.operations) {
        op(ctx, ctx.eventArg);
      }
      return [ctx.state, ctx.events] as const;
    };
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

interface UsageOptions<VarName extends string = string>
  extends VariableOptions {
  /** 设置变量名。默认的变量名为 `usage`；如果该变量名已被占用，则会在后面加上 `_${skillId}`。*/
  name?: VarName;
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
      Meta["callerVars"]
    >,
    triggerFilter: SkillFilter<Meta> = () => true,
  ) {
    super(id);
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
  private _usageOpt: Required<UsageOptions> | null = null;
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
      },
      EventName
    >
  > {
    if (this._usageOpt !== null) {
      throw new GiTcgDataError(`Usage called twice`);
    }
    const perRound = opt?.perRound ?? false;
    const name =
      opt?.name ??
      // @ts-expect-error private prop
      ("usage" in this.parent._constants ? `usage_${this.id}` : "usage");
    this.parent.variable(name, count, {
      ...opt,
      recreateMax: opt?.recreateMax ?? count,
    });
    if (perRound) {
      // @ts-expect-error private prop
      this.parent._usagePerRoundVarNames.push(this._usagePerRoundName);
    }
    this._usageOpt = {
      visible: opt?.visible ?? true,
      autoDecrease: opt?.autoDecrease ?? true,
      autoDispose: opt?.autoDispose ?? true,
      name,
      perRound,
      recreateMax: opt?.recreateMax ?? count,
    };
    // 增加“检查可用次数”的技能出发条件
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
  usagePerRound(count: number, opt?: Omit<UsageOptions, "perRound">) {
    return this.usage(count, { ...opt, perRound: true, visible: false });
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
    if (this._usageOpt) {
      const { name, autoDecrease, autoDispose, perRound } = this._usageOpt;
      this.do((c) => {
        if (autoDecrease) {
          c.addVariable(name, -1);
        }
        // 带使用次数（非每回合重置的），次数耗尽时弃置
        if (autoDispose && !perRound && c.getVariable(name) <= 0) {
          c.dispose();
        }
      });
    }
    const [eventName] = detailedEventDictionary[this.triggerOn];
    const filter: TriggeredSkillFilter<any> = (state, caller, arg) => {
      const ctx = new SkillContext(state, caller, arg);
      return !!this._triggerFilter(ctx as any, arg);
    };
    const action: SkillDescription<any> = (state, skillInfo, arg) => {
      return this.getAction(arg)(state, skillInfo);
    };
    const def: TriggeredSkillDefinition = {
      type: "skill",
      skillType: null,
      id: this.id,
      triggerOn: eventName,
      requiredCost: [],
      filter,
      action,
    };
    registerSkill(def);
    // @ts-expect-error private prop
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

export abstract class SkillBuilderWithCost<EventArg> extends SkillBuilder<{
  callerType: "character";
  callerVars: never;
  eventArgType: EventArg;
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

class InitiativeSkillBuilder extends SkillBuilderWithCost<void> {
  private _skillType: SkillType = "normal";
  private _gainEnergy = true;
  protected _cost: DiceType[] = [];
  constructor(private readonly skillId: number) {
    super(skillId);
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
    if (this._gainEnergy) {
      this.do((c) => c.self.gainEnergy(1));
    }
    const action: SkillDescription<void> = this.getAction();
    registerSkill({
      type: "skill",
      skillType: this._skillType,
      id: this.skillId,
      triggerOn: null,
      requiredCost: this._cost,
      action,
    });
    return this.skillId as SkillHandle;
  }
}

export function skill(id: number) {
  return enableShortcut(new InitiativeSkillBuilder(id));
}
