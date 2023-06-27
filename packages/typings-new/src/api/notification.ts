import { DiceType, DamageType, Aura } from "../enums";

export type PhaseType = "initHands" | "initActives" | "roll" | "action" | "end" | "gameEnd";

export interface CharacterData {
  id: number;
  entityId: number;
  health: number;
  energy: number;
  weapon: number | null;
  artifact: number | null;
  equipments: number[];
  statuses: StatusData[];
  applied: Aura;
}

export interface StatusData {
  id: number;
  entityId: number;
  value?: number;
}

export interface SupportData {
  id: number;
  entityId: number;
  value?: number;
}

export interface SummonData {
  id: number;
  entityId: number;
  value: number;
}

export interface MyPlayerData {
  type: "my";
  pileNumber: number;
  active: number | null;
  hands: number[],
  characters: CharacterData[];
  combatStatuses: StatusData[];
  supports: SupportData[];
  summons: SummonData[];
  dice: DiceType[];
}

export interface OppPlayerData {
  type: "opp";
  pileNumber: number;
  active: number | null;
  hands: number;
  characters: CharacterData[];
  combatStatuses: StatusData[];
  supports: SupportData[];
  summons: SummonData[];
  dice: number;
}

export interface StateData {
  phase: PhaseType;
  turn: number;
  players: [MyPlayerData, OppPlayerData];
}

export interface Event {
  // TODO
}

export type NotificationMessage = {
  events?: Event[],
  state: StateData
}
