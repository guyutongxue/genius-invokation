import { DiceType, DamageType, Aura } from "../enums";

export type PhaseType =
  | "initHands"
  | "initActives"
  | "roll"
  | "action"
  | "end"
  | "gameEnd";

export interface CharacterData {
  id: number;
  definitionId: number;
  defeated: boolean;
  entities: EntityData[];
  health: number;
  energy: number;
  aura: Aura;
}

export interface EntityData {
  id: number;
  definitionId: number;
  value?: number;
}

export interface CardData {
  id: number;
  definitionId: number;
}

export interface PlayerDataBase {
  pileNumber: number;
  activeCharacterId: number | null;
  characters: CharacterData[];
  combatStatuses: EntityData[];
  supports: EntityData[];
  summons: EntityData[];
  legendUsed: boolean;
}

export interface MyPlayerData extends PlayerDataBase {
  type: "my";
  hands: CardData[];
  dice: DiceType[];
}

export interface OppPlayerData extends PlayerDataBase {
  type: "opp";
  hands: number;
  dice: number;
}

export interface StateData {
  phase: PhaseType;
  roundNumber: number;
  currentTurn: number;
  players: [MyPlayerData, OppPlayerData];
}

export interface GamePhaseEvent {
  type: "newGamePhase";
  roundNumber: number;
  isFirst: boolean;
}
export interface GameEndEvent {
  type: "gameEnd";
  win?: boolean; // undefined for tie
}
export interface DamageData {
  type: DamageType;
  value: number;
  target: number;
  log: {
    source: number;
    what: string;
  }[];
}
export interface StateUpdatedEvent {
  type: "stateUpdated";
  source?: number;
  damages: DamageData[];
}
export interface PlayCardEvent {
  type: "playCard";
  card: number;
  opp: boolean;
}
export interface UseSkillEvent {
  type: "useSkill";
  skill: number;
  opp: boolean;
}
export interface OppChangeHandsEvent {
  type: "oppChangeHands";
  removed: number;
  added: number;
  discarded: number;
}
export interface SwitchActiveEvent {
  type: "switchActive";
  opp: boolean;
  target: number;
  source?: number | string; // id or "elementalReaction" or ...
}
export interface DeclareEndEvent {
  type: "declareEnd";
  opp: boolean;
}
export interface OtherEvent {
  type: "oppChoosingActive" | "oppAction"
}
export type Event =
  | GamePhaseEvent
  | GameEndEvent
  | StateUpdatedEvent
  | PlayCardEvent
  | UseSkillEvent
  | OppChangeHandsEvent
  | SwitchActiveEvent
  | DeclareEndEvent
  | OtherEvent;

export type NotificationMessage = {
  event: Event;
  state: StateData;
};
