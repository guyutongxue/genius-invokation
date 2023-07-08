// type JsonRpcResponse<R> = {
//   jsonrpc: "2.0";
//   result: R;
//   id: number;
// }

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

export interface SwitchActiveActionResponse {
  type: "switchActive";
  active: number;
  dice: DiceType[];
}

export interface PlayCardActionResponse {
  type: "playCard";
  card: number;
  dice: DiceType[];
  target?: number[];
}

export interface UseSkillActionResponse {
  type: "useSkill";
  skill: number;
  dice: DiceType[];
}

export interface ElementalTuningActionResponse {
  type: "elementalTuning";
  discardedCard: number;
  dice: [DiceType];
}

export interface DeclareEndActionResponse {
  type: "declareEnd";
}

export type ActionResponse =
  | SwitchActiveActionResponse
  | PlayCardActionResponse
  | UseSkillActionResponse
  | ElementalTuningActionResponse
  | DeclareEndActionResponse;

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
