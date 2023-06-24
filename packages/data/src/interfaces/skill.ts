import { DiceType } from "@jenshin-tcg/typings";

export type ManualSkillType = "normal" | "skill" | "burst";
export type SkillType = ManualSkillType | "prepared";

export type SkillInfo = {
  readonly name: string;
  readonly gainEnergy: boolean;
} & ({
  readonly type: ManualSkillType;
  readonly costs: DiceType[];
} | {
  readonly type: "prepared";
  readonly round: number;
})

