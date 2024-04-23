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

import {
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  NotificationMessage,
  RerollDiceResponse,
  SwitchHandsResponse,
} from "@gi-tcg/typings";
import { Agent } from ".";

export class DumbAgent implements Agent {
  async rerollDice(): Promise<RerollDiceResponse> {
    return { rerollIndexes: [] };
  }
  async switchHands(): Promise<SwitchHandsResponse> {
    return { removedHands: [] };
  }
  async chooseActive({
    candidates,
  }: ChooseActiveRequest): Promise<ChooseActiveResponse> {
    return { active: candidates[0] };
  }
  async action({ candidates }: ActionRequest): Promise<ActionResponse> {
    const declareEndIdx = candidates.findIndex(
      (action) => action.type === "declareEnd",
    );
    return { chosenIndex: declareEndIdx, cost: [] };
  }
}
