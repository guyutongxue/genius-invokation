import { DiceType } from "@jenshin-tcg/typings";

export type SkillType = "normal" | "skill" | "burst";

export interface SkillInfo {
  readonly name: string;
  readonly type: SkillType;
  readonly costs: DiceType[];
}

