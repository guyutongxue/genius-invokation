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

import type { DiceType } from "../enums";
import type { PreviewData } from "./preview";

export interface RerollDiceRequest {}

export interface SwitchHandsRequest {}

export interface ChooseActiveRequest {
  /**
   * @minItems 1
   */
  candidates: readonly number[];
}

export interface SelectCardRequest {
  /**
   * 可供选择的卡牌定义 ID
   * @minItems 1
   */
  cards: readonly number[];
}

export interface ActionRequest {
  /**
   * @minItems 1
   */
  candidates: readonly Action[];
}

export interface SwitchActiveAction {
  type: "switchActive";
  active: number;
  cost: readonly DiceType[];
  preview: PreviewData[];
}
export interface PlayCardAction {
  type: "playCard";
  card: number;
  cost: readonly DiceType[];
  targets: readonly number[];
  preview: PreviewData[];
}

export interface UseSkillAction {
  type: "useSkill";
  skill: number;
  cost: readonly DiceType[];
  targets: readonly number[];
  preview: PreviewData[];
}

export interface ElementalTuningAction {
  type: "elementalTuning";
  discardedCard: number;
  target: DiceType;
  preview: PreviewData[];
}

export interface DeclareEndAction {
  type: "declareEnd";
  preview: PreviewData[];
}

export type Action = SwitchActiveAction | PlayCardAction | UseSkillAction | ElementalTuningAction | DeclareEndAction;

export type RpcRequest = {
  rerollDice: RerollDiceRequest;
  switchHands: SwitchHandsRequest;
  chooseActive: ChooseActiveRequest;
  selectCard: SelectCardRequest;
  action: ActionRequest;
};

export type RpcMethod = keyof RpcRequest;
export type Request = RpcRequest[RpcMethod];
