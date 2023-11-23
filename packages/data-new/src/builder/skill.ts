import { DamageType } from "@gi-tcg/typings";
import { Mutation, applyMutation } from "../mutation";
import { registerSkill } from "../registry";
import {
  InSkillEventPayload,
  SkillDefinition,
  SkillDescription,
  SkillType,
} from "../skill";
import { GameState } from "../state";
import { StrictlyTypedSkillContext, SkillContext } from "./context";
import { TargetQueryArg } from "./query";
import { AppliableDamageType, SkillHandle, SummonHandle } from "./type";

type SkillOperation = (c: StrictlyTypedSkillContext<false>) => void | Promise<void>;

type SkillFilter = (c: StrictlyTypedSkillContext<true>) => boolean;

class SkillBuilder {
  protected operations: SkillOperation[] = [];
  constructor(private readonly id: number) {}

  if(filter: SkillFilter) {
    // TODO
  }

  do(op: SkillOperation) {
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

  protected getAction(): SkillDescription<any> {
    return async (st: GameState, callerId: number) => {
      const ctx = new SkillContext<false>(st, this.id, callerId);
      for (const op of this.operations) {
        await op(ctx);
      }
      return [ctx.state, ctx.events] as const;
    };
  }
}

class InitiativeSkillBuilder extends SkillBuilder {
  private _skillType: SkillType = "normal";
  constructor(private readonly skillId: number) {
    super(skillId);
  }

  done(): SkillHandle {
    const action: SkillDescription<never> = this.getAction();
    const def = {
      type: "skill" as const,
      skillType: this._skillType,
      id: this.skillId,
      triggerOn: null,
      action,
    };
    registerSkill(def);
    return this.skillId as SkillHandle;
  }
}

export function skill(id: number) {
  return new InitiativeSkillBuilder(id);
}
