import type { DiceType } from "../enums";

export interface RerollDiceRequest {
  dice: readonly DiceType[];
}

export interface SwitchHandsRequest {}

export interface ChooseActiveRequest {
  candidates: readonly number[];
}

export interface ActionRequest {
  candidates: readonly Action[];
}

export interface SwitchActiveAction {
  type: "switchActive";
  active: number;
  cost: readonly DiceType[];
}

export enum PlayCardHint {
  GeneralTarget,
  GeneralTarget2,
  DisposeSupport,
}

export interface PlayCardAction {
  type: "playCard";
  card: number;
  cost: readonly DiceType[];
  hints: readonly PlayCardHint[];
  targets: readonly number[];
}

export interface UseSkillAction {
  type: "useSkill";
  skill: number;
  cost: readonly DiceType[];
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
