import { PhaseType, DiceType, Aura } from "@gi-tcg/typings";

export interface GameState {
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
  readonly skillLog: readonly unknown[];
  readonly mutationLog: readonly unknown[];
}

export interface PlayerState {
  readonly piles: readonly CardState[];
  readonly activeCharacterIndex: number;
  readonly hands: readonly CardState[];
  readonly characters: readonly CharacterState[];
  readonly combatStatuses: readonly EntityState[];
  readonly supports: readonly EntityState[];
  readonly summons: readonly EntityState[];
  readonly dice: readonly DiceType[];
  readonly declaredEnd: boolean;
  // readonly hasDefeated: boolean;
  // readonly canPlunging: boolean;
  readonly legendUsed: boolean;
  readonly skipNextTurn: boolean;
}

export interface CardState {
  readonly id: number;
  readonly typeId: number;
}

export interface CharacterState {
  readonly id: number;
  readonly typeId: number;
  readonly defeated: boolean;
  readonly entities: readonly EntityState[];
  readonly variables: CharacterVariables;
}

export interface EntityState {
  readonly id: number;
  readonly typeId: number;
  readonly variables: EntityVariables;
}

interface EntityVariables {
  readonly usagePerRound: number;
  readonly usage: number;
  readonly duration: number;
  readonly [key: string]: number;
};

interface CharacterVariables {
  readonly health: number;
  readonly energy: number;
  readonly aura: Aura;
  readonly [key: string]: number;
};
