import { DamageType, DiceType } from "@gi-tcg/typings";
import { registerSkill } from "../registry";
import {
  SkillDescription,
  SkillType,
} from "../skill";
import { GameState } from "../state";
import {
  SkillContext,
  ExtendedSkillContext,
} from "./context";
import { TargetQueryArg } from "./query";
import {
  AppliableDamageType,
  SkillHandle,
  SummonHandle,
} from "./type";

type SkillOperation<Ext extends object, EventArg> = (
  c: ExtendedSkillContext<false, Ext>,
  e: EventArg,
) => void | Promise<void>;

type SkillFilter<Ext extends object, EventArg> = (
  c: ExtendedSkillContext<true, Ext>,
  e: EventArg,
) => boolean;

class SkillBuilder<Ext extends object, EventArg> {
  protected operations: SkillOperation<Ext, EventArg>[] = [];
  constructor(private readonly id: number) {}

  if(filter: SkillFilter<Ext, EventArg>) {
    // TODO
  }

  do(op: SkillOperation<Ext, EventArg>) {
    this.operations.push(op);
    return this;
  }

  switchActive(target: TargetQueryArg<false>) {
    return this.do((c) => c.switchActive(target));
  }
  gainEnergy(value: number, target: TargetQueryArg<false>) {
    return this.do((c) => c.gainEnergy(value, target));
  }
  heal(value: number, target: TargetQueryArg<false>) {
    return this.do((c) => c.heal(value, target));
  }
  damage(
    value: number,
    type: DamageType,
    target: TargetQueryArg<false> = ($) => $.opp().active(),
  ) {
    return this.do((c) => c.damage(value, type, target));
  }
  apply(type: AppliableDamageType, target: TargetQueryArg<false>) {
    return this.do((c) => c.apply(type, target));
  }
  summon(id: SummonHandle) {
    return this.do((c) => c.summon(id));
  }

  /**
   * 生成内部技能描述函数。
   * 给定两个参数：它们接受 `SkillContext` 然后转换到对应扩展点或第二参数。
   * 这些参数将传递给用户。
   * @param extGenerator 生成扩展点的函数
   * @param evaGenerator 生成事件参数（用户第二参数）的函数
   * @returns 内部技能描述函数
   */
  protected getAction(
    extGenerator: (skillCtx: SkillContext<false>) => Ext,
    evaGenerator: (skillCtx: SkillContext<false>) => EventArg,
  ): SkillDescription<any> {
    return async (st: GameState, callerId: number) => {
      const ctx = new SkillContext<false>(st, this.id, callerId);
      const ext = extGenerator(ctx);
      const eva = evaGenerator(ctx);
      const wrapped = extendSKillContext(ctx, ext);
      for (const op of this.operations) {
        await op(wrapped, eva);
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
export function extendSKillContext<Readonly extends boolean, Ext extends object>(ctx: ExtendedSkillContext<Readonly, {}>, ext: Ext): ExtendedSkillContext<Readonly, Ext> {
  return new Proxy(ctx, {
    get(target, prop, receiver) {
      if (prop in ext) {
        return Reflect.get(ext, prop, receiver);
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
  }) as ExtendedSkillContext<Readonly, Ext>;
}

class TriggeredSkillBuilder<Ext extends object = {}> extends SkillBuilder<
  Ext,
  void
> {
  constructor(private readonly skillId: number) {
    super(skillId);
  }
}

export class SkillBuilderWithCost<Ext extends object> extends SkillBuilder<Ext, void> {
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

  done(): SkillHandle {
    const action: SkillDescription<void> = this.getAction(
      () => ({}),
      () => {},
    );
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
