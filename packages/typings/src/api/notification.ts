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
import type { DiceType, DamageType, Aura, Reaction } from "../enums";

export type PhaseType =
  | "initHands"
  | "initActives"
  | "roll"
  | "action"
  | "end"
  | "gameEnd";

export interface CharacterData {
  id: number;
  definitionId: number;
  defeated: boolean;
  entities: EntityData[];
  health: number;
  energy: number;
  maxEnergy: number;
  aura: Aura;
}

export interface EntityData {
  id: number;
  definitionId: number;
  variable: number | null;
  hintIcon: number | null;
  hintText: string | null;
  equipment: "weapon" | "artifact" | boolean;
}

export interface CardData {
  id: number;
  definitionId: number;
  definitionCost: DiceType[];
}

export interface SkillData {
  definitionId: number;
  definitionCost: DiceType[];
}

export interface PlayerData {
  activeCharacterId: number | null;
  characters: CharacterData[];
  piles: CardData[];
  hands: CardData[];
  dice: DiceType[];
  combatStatuses: EntityData[];
  supports: EntityData[];
  summons: EntityData[];
  skills: SkillData[];
  declaredEnd: boolean;
  legendUsed: boolean;
}

export interface StateData {
  phase: PhaseType;
  roundNumber: number;
  currentTurn: number;
  winner: 0 | 1 | null;
  players: [PlayerData, PlayerData];
}

export interface DamageData {
  type: DamageType;
  value: number;
  target: number;
  log: string;
}
export interface DamageEvent {
  type: "damage";
  damage: DamageData;
}
export interface ElementalReactionEvent {
  type: "elementalReaction";
  on: number;
  reactionType: Reaction;
}
export interface UseCommonSkillEvent {
  type: "useCommonSkill";
  skill: number;
  who: 0 | 1;
}
export interface TriggeredEvent {
  type: "triggered";
  id: number;
}
export interface OtherEvent {
  type: "oppChoosingActive" | "oppAction"
}
export type Event =
  | DamageEvent
  | ElementalReactionEvent
  | UseCommonSkillEvent
  | TriggeredEvent
  | OtherEvent;

export type NotificationMessage = {
  events: Event[];
  mutations: ExposedMutation[];
  newState: StateData;
};
