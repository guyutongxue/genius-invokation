import { EquipmentTag, SupportTag } from "./card";
import { TriggeredSkillDefinition } from "./skill";

export type EntityTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "immuneControl" // 免疫冻结石化眩晕
  | "shield" // 护盾
  | "debuff" // 自伤（不计入增伤）
  | EquipmentTag
  | SupportTag;

export type EntityType =
  | "passiveSkill"
  | "status"
  | "combatStatus"
  | "equipment"
  | "support"
  | "summon";

export interface EntityDefinition {
  readonly type: EntityType;
  readonly id: number;
  readonly visibleVarName: string | null;
  readonly tags: readonly EntityTag[];
  readonly hintText: string | null;
  readonly constants: EntityVariables;
  readonly skills: readonly TriggeredSkillDefinition[];
}

export interface EntityVariables {
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
