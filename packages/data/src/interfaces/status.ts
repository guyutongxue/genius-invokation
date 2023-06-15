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
  onDamaged?: (c: DamageContext) => HandlerResult;
}

export interface IStatusConstructor {
  new (...args: any[]): IStatus;
}
