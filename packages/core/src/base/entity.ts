import { EquipmentTag, SupportTag } from "./card";
import { TriggeredSkillDefinition } from "./skill";

export type EntityTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "immuneControl" // 免疫冻结石化眩晕（仅出战状态）
  | "shield" // 护盾
  | "debuff" // 自伤（不计入增伤）
  | "disableEvent" // 禁用事件牌效果（仅出战状态）
  | EquipmentTag
  | SupportTag;

export type EntityType =
  | "status"
  | "combatStatus"
  | "equipment"
  | "support"
  | "summon";

export type ExEntityType = "character" | EntityType;

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
  readonly usage: number;
  // usage 到达 0 后是否自动弃置
  //（用于判断“送你一程”扣除使用次数后是否弃置召唤物）
  readonly disposeWhenUsageIsZero: number;
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
