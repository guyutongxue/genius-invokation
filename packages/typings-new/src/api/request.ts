// type JsonRpcRequest<M extends string, P> = {
//   jsonrpc: "2.0";
//   method: M;
//   params: P;
//   id: number;
// };

export interface RerollDiceRequest {}

export interface SwitchHandsRequest {}

export interface ChooseActiveRequest {
  candidates: number[];
}

export interface ActionRequest {
  candidates: Action[];
}

export interface SwitchActiveAction {
  type: "switchActive";
  active: number;
}

// export interface PlayCardCharacterTarget {
//   type: "character";
//   id: number;
//   opp?: boolean;
//   hint?: string;
// }

// export interface PlayCardSummonTarget {
//   type: "summon";
//   id: number;
//   opp?: boolean;
//   hint?: string;
// }

export type PlayCardTarget = /* PlayCardCharacterTarget | PlayCardSummonTarget */ {
  type: "character" | "summon";
  id: number;
  opp?: boolean;
  hint?: string;
};

export interface PlayCardAction {
  type: "playCard";
  card: number;
  target?: PlayCardTarget[][];
}

export type Action = {};

export type RpcRequest = {
  rerollDice: RerollDiceRequest;
  switchHands: SwitchHandsRequest;
  chooseActive: ChooseActiveRequest;
  action: ActionRequest;
};

export type RpcMethod = keyof RpcRequest;
export type Request = RpcRequest[RpcMethod];
