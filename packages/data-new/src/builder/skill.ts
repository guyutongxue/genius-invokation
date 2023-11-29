import { DamageType, DiceType } from "@gi-tcg/typings";
import { registerSkill } from "../registry";
import {
  CommonSkillType,
  SkillDescription,
  SkillType,
  EventNames,
  EventArg,
  SkillInfo,
  TriggeredSkillDefinition,
} from "../base/skill";
import { GameState } from "../base/state";
import { SkillContext, ExtendedSkillContext } from "./context";
import { TargetQueryArg } from "./query";
import {
  AppliableDamageType,
  ExEntityType,
  HandleT,
  SkillHandle,
  SummonHandle,
} from "./type";
import { EntityArea, EntityType } from "../base/entity";
import { EntityBuilder } from "./entity";
import { getEntityArea } from "../util";

type EventArgOfExt<Ext extends object> = Ext extends { eventArg: infer T }
  ? T
  : void;

type SkillOperation<Ext extends object, CallerType extends ExEntityType> = (
  c: ExtendedSkillContext<false, Ext, CallerType>,
  e: EventArgOfExt<Ext>,
) => void;

type SkillFilter<Ext extends object, CallerType extends ExEntityType> = (
  c: ExtendedSkillContext<true, Ext, CallerType>,
  e: EventArgOfExt<Ext>,
) => boolean;

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
      case ListenTo.SameArea:
        if (
          r.callerArea.type === "characters" &&
          entityArea.type === "characters"
        ) {
          return r.callerArea.characterId === entityArea.characterId;
        }
      // passthrough
      case ListenTo.SamePlayer:
        return r.callerArea.who === entityArea.who;
      case ListenTo.All:
        return true;
      default:
        const _: never = r.listenTo;
        throw new Error(`Unknown listenTo: ${_}`);
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
  (e: EventArg<E>, listen: RelativeArg) => boolean,
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
 *
 * 第 2 条检测的方法是查看 `skillInfo.requestBy`。对于准备技能，
 * `skillInfo.requestBy` 是准备状态，其不可能包含 `fromCard` 值；
 * 第 3 条所述的技能则包含 `fromCard`。
 */
function commonInitiativeSkillCheck(skillInfo: SkillInfo) {
  if (
    skillInfo.definition.triggerOn === null &&
    skillInfo.definition.skillType !== "card"
  ) {
    // 主动技能且并非卡牌描述
    const requestBy = skillInfo.requestBy;
    if (
      requestBy &&
      requestBy.caller.definition.type !== "character" &&
      requestBy.caller.definition.tags.includes("preparing")
    ) {
      // 准备技能不触发
      return false;
    }
    return true;
  }
  return false;
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
  roll: defineDescriptor("onRoll", (e, r) => {
    return checkRelative(e.state, e.who, r);
  }),
  beforeUseDice: defineDescriptor("onBeforeUseDice", (e, r) => {
    return checkRelative(e.state, e.who, r);
  }),
  beforeDamageType: defineDescriptor("onBeforeDamage0", (e, r) => {
    return checkRelative(e.state, e.info.source.id, r);
  }),
  beforeDealDamage: defineDescriptor("onBeforeDamage1", (e, r) => {
    return (
      e.info.type !== DamageType.Piercing &&
      checkRelative(e.state, e.info.source.id, r)
    );
  }),
  beforeSkillDamage: defineDescriptor("onBeforeDamage1", (e, r) => {
    return (
      e.info.type !== DamageType.Piercing &&
      checkRelative(e.state, e.info.source.id, r) &&
      commonInitiativeSkillCheck(e.info.via)
    );
  }),
  beforeDamaged: defineDescriptor("onBeforeDamage1", (e, r) => {
    return (
      e.info.type !== DamageType.Piercing &&
      checkRelative(e.state, e.info.target.id, r)
    );
  }),
  beforeDefeated: defineDescriptor("onBeforeDefeated", (e, r) => {
    return checkRelative(e.state, e.info.target.id, r);
  }),

  battleBegin: defineDescriptor("onBattleBegin"),
  actionPhase: defineDescriptor("onActionPhase"),
  endPhase: defineDescriptor("onEndPhase"),
  beforeAction: defineDescriptor("onBeforeAction", (e, r) => {
    return checkRelative(e.state, e.who, r);
  }),
  action: defineDescriptor("onAction", (e, r) => {
    return checkRelative(e.state, e.who, r);
  }),
  playCard: defineDescriptor("onAction", (e, r) => {
    if (!checkRelative(e.state, e.who, r)) return false;
    return e.type === "playCard";
  }),
  declareEnd: defineDescriptor("onAction", (e, r) => {
    if (!checkRelative(e.state, e.who, r)) return false;
    return e.type === "declareEnd";
  }),
  skill: defineDescriptor("onSkill", (e, r) => {
    if (!checkRelative(e.state, e.caller.id, r)) return false;
    return commonInitiativeSkillCheck(e);
  }),
  switchActive: defineDescriptor("onSwitchActive", (e, r) => {
    return (
      checkRelative(e.state, e.from.id, r) || checkRelative(e.state, e.to.id, r)
    );
  }),
  dealDamage: defineDescriptor("onDamage", (e, r) => {
    return checkRelative(e.state, e.source.id, r);
  }),
  damaged: defineDescriptor("onDamage", (e, r) => {
    return checkRelative(e.state, e.target.id, r);
  }),
  healed: defineDescriptor("onHeal", (e, r) => {
    return checkRelative(e.state, e.target.id, r);
  }),
  elementalReaction: defineDescriptor("onElementalReaction", (e, r) => {
    return checkRelative(e.state, e.target.id, r);
  }),
  enter: defineDescriptor("onEnter", (e, r) => {
    return e.entity.id === r.callerId;
  }),
  dispose: defineDescriptor("onDisposing", (e, r) => {
    return checkRelative(e.state, e.entity.id, r);
  }),
} satisfies Record<string, Descriptor<any>>;

type DetailedEventDictionary = typeof detailedEventDictionary;
export type DetailedEventNames = keyof DetailedEventDictionary;
export type DetailedEventArg<E extends DetailedEventNames> = EventArg<
  DetailedEventDictionary[E][0]
>;

class SkillBuilder<Ext extends object, CallerType extends ExEntityType> {
  protected operations: SkillOperation<Ext, CallerType>[] = [];
  constructor(
    protected readonly callerType: CallerType,
    protected readonly id: number,
  ) {}

  if(filter: SkillFilter<Ext, CallerType>) {
    // TODO
  }

  do(op: SkillOperation<Ext, CallerType>) {
    this.operations.push(op);
    return this;
  }

  switchActive(target: TargetQueryArg<false, Ext, CallerType>) {
    return this.do((c) => c.switchActive(target));
  }
  gainEnergy(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    return this.do((c) => c.gainEnergy(value, target));
  }
  heal(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    return this.do((c) => c.heal(value, target));
  }
  damage(
    value: number,
    type: DamageType,
    target: TargetQueryArg<false, Ext, CallerType> = ($) => $.opp().active(),
  ) {
    return this.do((c) => c.damage(value, type, target));
  }
  apply(
    type: AppliableDamageType,
    target: TargetQueryArg<false, Ext, CallerType>,
  ) {
    return this.do((c) => c.apply(type, target));
  }
  summon(id: SummonHandle) {
    return this.do((c) => c.summon(id));
  }

  /**
   * 生成内部技能描述函数。
   * 给定两个参数：它们接受 `SkillContext` 然后转换到对应扩展点。
   * 这些参数将传递给用户。
   * @param extGenerator 生成扩展点的函数
   * @returns 内部技能描述函数
   */
  protected getAction(
    extGenerator: (skillCtx: SkillContext<false, Ext, CallerType>) => Ext,
  ): SkillDescription<void> {
    return (st: GameState, callerId: number) => {
      const ctx = new SkillContext<false, Ext, CallerType>(
        st,
        this.id,
        callerId,
      );
      const ext = extGenerator(ctx);
      const wrapped = extendSkillContext<false, Ext, CallerType>(ctx, ext);
      for (const op of this.operations) {
        op(wrapped, (ext as any)?.eventArg);
      }
      return [ctx.state, ctx.events] as const;
    };
  }
}

/**
 *
 * @param ctx 原 `SkillContext`
 * @param ext 扩展点
 * @returns 通过 `Proxy` 扩展后的 `SkillContext`
 */
export function extendSkillContext<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
>(
  ctx: ExtendedSkillContext<Readonly, any, CallerType>,
  ext: Ext,
): ExtendedSkillContext<Readonly, Ext, CallerType> {
  return new Proxy(ctx, {
    get(target, prop, receiver) {
      if (prop in ext) {
        return Reflect.get(ext, prop, receiver);
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
  }) as ExtendedSkillContext<Readonly, Ext, CallerType>;
}

export class TriggeredSkillBuilder<
  Ext extends object,
  CallerType extends EntityType,
  EN extends DetailedEventNames,
> extends SkillBuilder<Ext, CallerType> {
  constructor(
    callerType: CallerType,
    id: number,
    private readonly triggerOn: EN,
    private readonly parent: EntityBuilder<Ext, CallerType>,
  ) {
    super(callerType, id);
  }

  private buildSkill() {
    const eventName = detailedEventDictionary[this.triggerOn][0];
    const action: SkillDescription<any> = (state, callerId, arg) => {
      const innerAction = this.getAction((ctx) => {
        return {
          eventArgs: arg,
        } as Ext;
      });
      return innerAction(state, callerId);
    };
    const def: TriggeredSkillDefinition = {
      type: "skill",
      id: this.id,
      triggerOn: eventName,
      action,
    };
    registerSkill(def);
    // Accessing private field
    ((this.parent as any)._skillList as TriggeredSkillDefinition[]).push(def);
  }

  on<E extends DetailedEventNames>(event: E) {
    this.buildSkill();
    return this.parent.on(event);
  }

  done(): HandleT<CallerType> {
    return this.parent.done();
  }
}

export class SkillBuilderWithCost<Ext extends object> extends SkillBuilder<
  Ext,
  "character"
> {
  constructor(skillId: number) {
    super("character", skillId);
  }
  protected _cost: DiceType[] = [];
  private cost(type: DiceType, count: number) {
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

class InitiativeSkillBuilder extends SkillBuilderWithCost<{}> {
  private _skillType: SkillType = "normal";
  protected _cost: DiceType[] = [];
  constructor(private readonly skillId: number) {
    super(skillId);
  }

  type(type: "passive"): EntityBuilder<object, "passiveSkill">;
  type(type: CommonSkillType): this;
  type(type: CommonSkillType | "passive"): any {
    if (type === "passive") {
      return new EntityBuilder("passiveSkill", this.skillId);
    }
    this._skillType = type;
    return this;
  }

  done(): SkillHandle {
    const action: SkillDescription<void> = this.getAction(() => ({}));
    registerSkill({
      type: "skill",
      skillType: this._skillType,
      id: this.skillId,
      triggerOn: null,
      costs: this._cost,
      action,
    });
    return this.skillId as SkillHandle;
  }
}

export function skill(id: number) {
  return new InitiativeSkillBuilder(id);
}
