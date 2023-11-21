import { EquipmentTag } from "./card";
import { TriggeredSkillDefinition } from "./skill";

export type EntityTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "immuneControl" // 免疫冻结石化眩晕
  | "shield" // 护盾
  | EquipmentTag;

export type EntityType = "status" | "combatStatus" | "equipment" | "support" | "summon";

export interface EntityDefinition {
  readonly type: EntityType;
  readonly id: number;
  readonly tags: EntityTag[];
  readonly constants: EntityVariables;
  readonly skills: TriggeredSkillDefinition[];
}

export interface EntityVariables {
  readonly usagePerRound: number;
  readonly usage: number;
  readonly duration: number;
  readonly [key: string]: number;
}

export type EntityArea =
  | {
      readonly type: "combatStatuses" | "supports" | "summons";
      readonly who: 0 | 1;
    }
  | {
      readonly type: "characters";
      readonly who: 0 | 1;
      readonly characterId: number;
    };
