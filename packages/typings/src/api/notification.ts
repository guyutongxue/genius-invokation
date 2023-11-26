import { ExposedMutation } from "..";
import { DiceType, DamageType, Aura, Reaction } from "../enums";

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
  variables: Record<string, number>;
}

export interface CardData {
  id: number;
  definitionId: number;
}

export interface PlayerData {
  activeCharacterId: number | null;
  characters: CharacterData[];
  piles: CardData[];
  hands: CardData[];
  dice: DiceType[];
  combatStatuses: EntityData[];
  supports: EntityData[];
  summons: EntityData[];
  declaredEnd: boolean;
  legendUsed: boolean;
}

export interface StateData {
  phase: PhaseType;
  roundNumber: number;
  currentTurn: number;
  winner: 0 | 1 | null;
  players: [PlayerData, PlayerData];
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
export interface DamageEvent {
  type: "damage";
  damage: DamageData;
}
export interface ElementalReactionEvent {
  type: "elementalReaction";
  on: number;
  reactionType: Reaction;
}
export interface UseSkillEvent {
  type: "useSkill";
  skill: number;
  who: 0 | 1;
}
export interface OtherEvent {
  type: "oppChoosingActive" | "oppAction"
}
export type Event =
  | DamageEvent
  | ElementalReactionEvent
  | UseSkillEvent
  | OtherEvent;

export type NotificationMessage = {
  events: Event[];
  mutations: ExposedMutation[];
  newState: StateData;
};
