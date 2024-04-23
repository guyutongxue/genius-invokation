import { PlayerIO } from "@gi-tcg/core";
import type { ActionRequest, ActionResponse, ChooseActiveRequest, ChooseActiveResponse, NotificationMessage, RerollDiceResponse, SwitchHandsResponse } from "@gi-tcg/typings";
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
    giveUp: false,
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
    }
  }
}
