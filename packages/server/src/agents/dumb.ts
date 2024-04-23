import { ActionRequest, ActionResponse, ChooseActiveRequest, ChooseActiveResponse, NotificationMessage, RerollDiceResponse, SwitchHandsResponse } from "@gi-tcg/typings";
import { Agent } from ".";

export class DumbAgent implements Agent {
  async rerollDice(): Promise<RerollDiceResponse> {
    return { rerollIndexes: [] }; 
  }
  async switchHands(): Promise<SwitchHandsResponse> {
    return { removedHands: [] };     
  }
  async chooseActive({ candidates }: ChooseActiveRequest): Promise<ChooseActiveResponse> {
    return { active: candidates[0] };     
  }
  async action({ candidates }: ActionRequest): Promise<ActionResponse> {
    const declareEndIdx = candidates.findIndex(action => action.type === "declareEnd");
    return { chosenIndex: declareEndIdx, cost: [] };
  }
}
