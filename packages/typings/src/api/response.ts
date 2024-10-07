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

import type { RpcMethod, RpcRequest } from "./request";
import type { DiceType } from "../enums";

export interface RerollDiceResponse {
  rerollIndexes: number[];
}

export interface SwitchHandsResponse {
  removedHands: number[];
}

export interface ChooseActiveResponse {
  active: number;
}

export interface SelectCardResponse {
  selected: number;
}

export interface ActionResponse {
  chosenIndex: number;
  cost: DiceType[];
}

export type RpcResponse = {
  rerollDice: RerollDiceResponse;
  switchHands: SwitchHandsResponse;
  chooseActive: ChooseActiveResponse;
  selectCard: SelectCardResponse;
  action: ActionResponse;
};

export type Response = RpcResponse[RpcMethod];
export type Handler = <M extends RpcMethod>(
  method: M,
  request: RpcRequest[M]
) => Promise<RpcResponse[M]>;
