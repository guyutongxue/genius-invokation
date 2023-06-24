import { Context, DamageContext, SkillContext, SwitchActiveContext } from "../contexts";
import { HandlerResult, IGlobalEvents } from "./global";

export type ShieldInfo = number | {
  readonly initial: number;
  readonly onRecreate?: (oldValue: number) => number;
}

export interface StatusInfo {
  readonly objectId: number;
  readonly duration?: number;
  readonly usage?: number;
  readonly visibleProp?: string;
  readonly shield?: ShieldInfo;
  readonly disableSkill?: boolean;
}

export interface IStatus extends IGlobalEvents {
  onBeforeUseSkill?: (c: SkillContext) => HandlerResult;
  onUseSkill?: (c: SkillContext) => HandlerResult;
  onSwitchActiveFrom?: (c: SwitchActiveContext) => HandlerResult;
  onSwitchActive?: (c: SwitchActiveContext) => HandlerResult;
  onBeforeDealDamage?: (c: DamageContext) => HandlerResult;
  onBeforeDamaged?: (c: DamageContext) => HandlerResult;
  onDamaged?: (c: DamageContext) => HandlerResult;
  onDisposed?: (c: Context) => void;
}

export interface IStatusConstructor {
  new (...args: any[]): IStatus;
}

export const noScopeSymbol = Symbol("noScope");
export function WithOpp(target: any, ctx: ClassMethodDecoratorContext) {
  target[noScopeSymbol] = true;
  return target;
}
