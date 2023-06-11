import type { Character } from "./character.js";

export type Pair<T> = [T, T];

export interface CoinTossState {
  type: "coinToss";
}

interface WithPlayersState {
  players: Pair<any>;
  piles: Pair<number[]>;
  characters: Pair<Character[]>;
  nextTurn: 0 | 1;
  combatStatuses: Pair<any[]>;
  supports: Pair<any[]>;
  summons: Pair<any[]>;
}

export interface InitHandsState extends WithPlayersState {
  type: "initHands";
}

interface WithHandsState extends WithPlayersState {
  hands: Pair<number[]>;
}

interface WithActivesState extends WithHandsState {
  actives: Pair<number>;
}

export interface InitActiveState extends WithHandsState {
  type: "initActive";
}

export interface RollPhaseState extends WithActivesState {
  type: "rollPhase";
}

interface WithDiceState extends WithActivesState {
  dice: Pair<number[]>; // todo
}

export interface ActionPhaseState extends WithDiceState {
  type: "actionPhase";
  turn: 0 | 1;
}

export interface EndPhaseState extends WithDiceState {
  type: "endPhase";
}

export interface ForceSwitchPlayerState extends WithDiceState {
  type: "forceSwitchPlayer";
  activePlayer: 0 | 1;
  nextState: "actionPhase" | "endPhase";
}

export interface GameEndState extends WithHandsState {
  type: "gameEnd";
  winner: 0 | 1;
  winnerActive: number;
}


export type State = CoinTossState | InitHandsState | InitActiveState | RollPhaseState | ActionPhaseState | ForceSwitchPlayerState | EndPhaseState | GameEndState;
