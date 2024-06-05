// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import type { ExposedMutation } from "./mutation";
import type { DiceType, Aura } from "../enums";

export type PhaseType =
  | "initHands"
  | "initActives"
  | "roll"
  | "action"
  | "end"
  | "gameEnd";

export interface CharacterData {
  /**
   * 全局唯一实体 id
   */
  id: number;

  /**
   * 角色定义 id
   */
  definitionId: number;

  /**
   * 角色是否倒下
   */
  defeated: boolean;

  /**
   * 该角色角色区实体，包括该角色装备和角色状态
   */
  entities: EntityData[];

  /**
   * 角色当前生命值
   */
  health: number;

  /**
   * 角色当前能量值
   */
  energy: number;

  /**
   * 角色最大生命值
   */
  maxHealth: number;

  /**
   * 角色最大能量值
   */
  maxEnergy: number;

  /**
   * 角色所附着元素
   */
  aura: Aura;
}

export interface EntityData {
  /**
   * 全局唯一实体 id
   */
  id: number;

  /**
   * 实体定义 id
   */
  definitionId: number;

  /**
   * 实体可见变量值（状态角标、召唤物/支援牌可用次数）
   */
  variable: number | null;

  /**
   * 描述中动态替换掉的变量值
   */
  descriptionDictionary: Record<`[${string}]`, string>;

  /**
   * 实体提示图标（召唤物伤害图标/支援牌治疗图标）
   */
  hintIcon: number | null;

  /**
   * 实体提示文本（召唤物伤害数值/支援牌治疗数值）
   */
  hintText: string | null;

  /**
   * 实体是否为装备。若是武器、圣遗物，则为 weapon 或 artifact 字符串
   */
  equipment: "weapon" | "artifact" | boolean;
}

export interface CardData {
  /**
   * 全局唯一实体 id
   */
  id: number;

  /**
   * 描述中动态替换掉的变量值
   */
  descriptionDictionary: Record<`[${string}]`, string>;

  /**
   * 行动牌定义 id
   */
  definitionId: number;

  /**
   * 行动牌原始打出骰子费用
   */
  definitionCost: DiceType[];
}

export interface SkillData {
  /**
   * 主动技能定义 id
   */
  definitionId: number;

  /**
   * 主动技能原始打出骰子费用
   */
  definitionCost: DiceType[];
}

export interface PlayerData {
  /**
   * 玩家当前出战角色实体 id
   */
  activeCharacterId: number | null;

  /**
   * 玩家所有角色牌
   */
  characters: CharacterData[];

  /**
   * 牌堆
   */
  piles: CardData[];

  /**
   * 手牌列表
   */
  hands: CardData[];

  /**
   * 骰子列表
   */
  dice: DiceType[];

  /**
   * 出战状态列表
   */
  combatStatuses: EntityData[];

  /**
   * 支援牌列表
   */
  supports: EntityData[];

  /**
   * 召唤物列表
   */
  summons: EntityData[];

  /**
   * 当前出战角色的主动技能列表
   */
  skills: SkillData[];

  /**
   * 玩家是否已宣布结束回合
   */
  declaredEnd: boolean;

  /**
   * 玩家是否使用了秘传揭令
   */
  legendUsed: boolean;
}

export interface StateData {
  /**
   * 当前游戏阶段
   */
  phase: PhaseType;

  /**
   * 当前回合数
   */
  roundNumber: number;

  /**
   * 当前行动轮玩家
   */
  currentTurn: 0 | 1;

  /**
   * 胜方玩家
   */
  winner: 0 | 1 | null;

  /**
   * 玩家数据
   */
  players: [PlayerData, PlayerData];
}

export type NotificationMessage = {
  /**
   * 此次通知发生时的可见对局状态
   */
  newState: StateData;

  /**
   * 自上次通知以来发生的可见变化
   */
  mutations: ExposedMutation[];
};
