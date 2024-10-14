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

import { PlayerIO } from "@gi-tcg/core";
import type {
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  NotificationMessage,
  RerollDiceResponse,
  SwitchHandsResponse,
} from "@gi-tcg/typings";
import { DumbAgent } from "./dumb";

export interface Agent {
  onNotify?(notification: NotificationMessage): void;
  switchHands(): Promise<SwitchHandsResponse>;
  rerollDice(): Promise<RerollDiceResponse>;
  chooseActive(arg: ChooseActiveRequest): Promise<ChooseActiveResponse>;
  action(arg: ActionRequest): Promise<ActionResponse>;
}

export type AgentType = "dumb";

export function playerIoFromAgent(agentType: AgentType): PlayerIO {
  let agent: Agent;
  switch (agentType) {
    case "dumb": {
      agent = new DumbAgent();
      break;
    }
    default:
      throw new Error(`Unknown agent: ${agentType}`);
  }
  return {
    notify: (n) => agent.onNotify?.(n),
    rpc: (m, data): any => {
      switch (m) {
        case "rerollDice":
          return agent.rerollDice();
        case "switchHands":
          return agent.switchHands();
        case "chooseActive":
          return agent.chooseActive(data as ChooseActiveRequest);
        case "action":
          return agent.action(data as ActionRequest);
      }
    },
  };
}
