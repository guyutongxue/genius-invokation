import { Context, DamageContext, SkillContext, SwitchActiveContext } from "../contexts";
import { HandlerResult, IGlobalEvents } from "./global";

export interface StatusInfo {
  readonly objectId: number;
  readonly duration?: number;
  readonly usage?: number;
  readonly visibleProp?: string;
}

export interface IStatus extends IGlobalEvents {
  onBeforeUseSkill?: (c: SkillContext) => HandlerResult;
  onUseSkill?: (c: SkillContext) => HandlerResult;
  onSwitchActiveFrom?: (c: SwitchActiveContext) => HandlerResult;
  onSwitchActive?: (c: SwitchActiveContext) => HandlerResult;
  onBeforeDealDamage?: (c: DamageContext) => HandlerResult;
  onBeforeDamaged?: (c: DamageContext) => HandlerResult;
  onDamaged?: (c: DamageContext) => HandlerResult;
}

export interface IStatusConstructor {
  new (...args: any[]): IStatus;
}

export const noScopeSymbol = Symbol("noScope");
export function WithOpp(target: any, ctx: ClassMethodDecoratorContext) {
  target[noScopeSymbol] = true;
  return target;
}
