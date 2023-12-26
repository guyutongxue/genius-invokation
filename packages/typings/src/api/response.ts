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

export interface ActionResponse {
  chosenIndex: number;
  cost: DiceType[];
}

export type RpcResponse = {
  rerollDice: RerollDiceResponse;
  switchHands: SwitchHandsResponse;
  chooseActive: ChooseActiveResponse;
  action: ActionResponse;
};

export type Response = RpcResponse[RpcMethod];
export type Handler = <M extends RpcMethod>(
  method: M,
  request: RpcRequest[M]
) => Promise<RpcResponse[M]>;
