import { DamageType, DiceType } from "@gi-tcg/typings";
import { registerSkill } from "../registry";
import { CommonSkillType, SkillDescription, SkillType } from "../base/skill";
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
import { EntityType } from "../base/entity";

type EventArgOf<Ext extends object> = Ext extends { eventArg: infer T }
  ? T
  : void;

type SkillOperation<Ext extends object, CallerType extends ExEntityType> = (
  c: ExtendedSkillContext<false, Ext, CallerType>,
  e: EventArgOf<Ext>,
) => void;

type SkillFilter<Ext extends object, CallerType extends ExEntityType> = (
  c: ExtendedSkillContext<true, Ext, CallerType>,
  e: EventArgOf<Ext>,
) => boolean;

class SkillBuilder<Ext extends object, CallerType extends ExEntityType> {
  protected operations: SkillOperation<Ext, CallerType>[] = [];
  constructor(
    private readonly callerType: CallerType,
    private readonly id: number,
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
   * 给定两个参数：它们接受 `SkillContext` 然后转换到对应扩展点或事件参数。
   * 这些参数将传递给用户。
   * @param extGenerator 生成扩展点的函数
   * @returns 内部技能描述函数
   */
  protected getAction(
    extGenerator: (skillCtx: SkillContext<false, Ext, CallerType>) => Ext,
  ): SkillDescription<any> {
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
> extends SkillBuilder<Ext, CallerType> {
  constructor(
    private readonly callerType2: CallerType,
    private readonly id2: number,
  ) {
    super(callerType2, id2);
  }

  done(): HandleT<CallerType> {
    // TODO: FIX ME
    return this.id2 as HandleT<CallerType>;
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

  type(type: "passive"): TriggeredSkillBuilder<object, "passiveSkill">;
  type(type: CommonSkillType): this;
  type(type: CommonSkillType | "passive"): any {
    if (type === "passive") {
      return new TriggeredSkillBuilder("passiveSkill", this.skillId);
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
