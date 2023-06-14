import { SkillContext, UseDiceContext } from "../contexts";

export interface StatusInfo {
  readonly objectId: number;
  readonly duration?: number;
  readonly usage?: number;
}

export interface IStatus {
  onBeforeUseSkill?: (c: SkillContext) => void;
  onUseSkill?: (c: SkillContext) => void;
  onBeforeUseDice?: (c: UseDiceContext) => void;
}


export interface IStatusConstructor {
  new (): IStatus;
}
