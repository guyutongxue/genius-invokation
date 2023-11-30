import type { DiceType } from "../enums";

export interface RerollDiceRequest {
  dice: DiceType[];
}

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
  cost: DiceType[];
}

export interface PlayCardAction {
  type: "playCard";
  card: number;
  cost: DiceType[];
  targets: number[];
}

export interface UseSkillAction {
  type: "useSkill";
  skill: number;
  cost: DiceType[];
}

export interface ElementalTuningAction {
  type: "elementalTuning";
  discardedCard: number;
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
