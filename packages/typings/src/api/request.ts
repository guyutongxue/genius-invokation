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

export interface PlayCardTarget {
  id: number;
  hint?: string;
};

export interface PlayCardAction {
  type: "playCard";
  card: number;
  target?: PlayCardTarget[][];
}

export interface UseSkillAction {
  type: "useSkill";
  skill: number;
}

export interface ElementalTuningAction {
  type: "elementalTuning";
}

export interface DeclareEndAction {
  type: "declareEnd";
}

export type Action = SwitchActiveAction | PlayCardAction | UseSkillAction | ElementalTuningAction | DeclareEndAction;

export type RpcRequest = {
  rerollDice: RerollDiceRequest;
  switchHands: SwitchHandsRequest;
  chooseActive: ChooseActiveRequest;
  action: ActionRequest;
};

export type RpcMethod = keyof RpcRequest;
export type Request = RpcRequest[RpcMethod];
