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

import { PhaseType, DiceType } from "@gi-tcg/typings";

import { CardDefinition } from "./card";
import { CharacterDefinition, CharacterVariableConfigs } from "./character";
import {
  EntityDefinition,
  EntityVariableConfigs,
  VariableOfConfig,
} from "./entity";
import { Mutation } from "./mutation";
import { DamageInfo, HealInfo, SkillInfo } from "./skill";
import { GameData } from "../builder/registry";
import { ExtensionDefinition } from "./extension";

export interface GameConfig {
  readonly randomSeed: number;
  readonly initialHands: number;
  readonly maxHands: number;
  readonly maxRounds: number;
  readonly maxSupports: number;
  readonly maxSummons: number;
  readonly initialDice: number;
  readonly maxDice: number;
}

export interface IteratorState {
  readonly random: number;
  readonly id: number;
}

export interface GameState {
  readonly data: GameData;
  readonly config: GameConfig;
  readonly iterators: IteratorState;
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
  readonly extensions: readonly ExtensionState[];
}

export interface PlayerState {
  readonly initialPiles: readonly CardDefinition[];
  readonly piles: readonly CardState[];
  readonly activeCharacterId: number;
  readonly hands: readonly CardState[];
  readonly characters: readonly CharacterState[];
  readonly combatStatuses: readonly EntityState[];
  readonly supports: readonly EntityState[];
  readonly summons: readonly EntityState[];
  readonly dice: readonly DiceType[];
  readonly declaredEnd: boolean;
  readonly hasDefeated: boolean;
  readonly canCharged: boolean;
  readonly canPlunging: boolean;
  readonly legendUsed: boolean;
  readonly skipNextTurn: boolean;
  /**
   * 每回合使用技能列表。
   * 键为技能发起者的角色定义 id，值为该定义下使用过的技能 id 列表 
   */
  readonly roundSkillLog: ReadonlyMap<number, number[]>;
}

export interface CardState {
  readonly id: number;
  readonly definition: CardDefinition;
}

export interface CharacterState {
  readonly id: number;
  readonly definition: CharacterDefinition;
  readonly entities: readonly EntityState[];
  readonly variables: CharacterVariables;
  readonly damageLog: readonly (DamageInfo | HealInfo)[];
}

export type CharacterVariables = VariableOfConfig<CharacterVariableConfigs>;

export interface EntityState {
  readonly id: number;
  readonly definition: EntityDefinition;
  readonly variables: EntityVariables;
}

export type EntityVariables = VariableOfConfig<EntityVariableConfigs>;

export type AnyState = CharacterState | EntityState;

export interface ExtensionState {
  readonly definition: ExtensionDefinition;
  readonly state: unknown;
}

export function stringifyState(st: AnyState | CardState): string {
  let type: string;
  if (st.definition.__definition === "cards") {
    type = "card";
  } else {
    type = st.definition.type;
  }
  return `[${type}:${st.definition.id}](${st.id})`;
}
