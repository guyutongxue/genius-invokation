import { Context, DamageContext, SkillContext } from "../contexts";
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
  onSwitchActiveFrom?: (c: Context) => HandlerResult; // TODO
  onSwitchActive?: (c: Context) => HandlerResult; // TODO
  onBeforeDealDamage?: (c: DamageContext) => HandlerResult;
  onBeforeDamaged?: (c: DamageContext) => HandlerResult;
  onDamaged?: (c: DamageContext) => HandlerResult;
}

export interface IStatusConstructor {
  new (...args: any[]): IStatus;
}
