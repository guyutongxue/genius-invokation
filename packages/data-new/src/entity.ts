import { EventHandlers } from "./skill";

export type EntityTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "shield"       // 护盾
  ;


export interface EntityDefinition {
  readonly type: "status" | "equipment" | "support" | "summon";
  readonly id: number;
  readonly tags: EntityTag[];
  readonly constants: EntityVariables;
  readonly skills: EventHandlers;
}

export interface EntityVariables {
  readonly usagePerRound: number;
  readonly usage: number;
  readonly duration: number;
  readonly [key: string]: number;
};
