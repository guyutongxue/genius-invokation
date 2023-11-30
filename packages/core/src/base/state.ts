import { PhaseType, DiceType } from "@gi-tcg/typings";

import { CardDefinition } from "./card";
import { CharacterDefinition, CharacterVariables } from "./character";
import { EntityArea, EntityDefinition, EntityVariables } from "./entity";
import { Mutation } from "./mutation";
import { SkillDefinition } from "./skill";

export interface GameConfig {
  randomSeed: number;
  initialHands: number;
  maxHands: number;
  maxRounds: number;
  maxSupports: number;
  maxSummons: number;
  initialDice: number;
  maxDice: number;
}

export interface IteratorState {
  readonly random: Int32Array;
  readonly id: number;
}

export interface SkillLogEntry {
  readonly roundNumber: number;
  readonly caller: CharacterState | EntityState;
  readonly callerArea: EntityArea;
  readonly skill: SkillDefinition;
}

export interface MutationLogEntry {
  readonly roundNumber: number;
  readonly mutation: Mutation;
}

export interface GameState {
  readonly config: GameConfig;
  readonly iterators: IteratorState;
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
  readonly skillLog: readonly SkillLogEntry[];
  readonly mutationLog: readonly MutationLogEntry[];
}

export interface PlayerState {
  readonly piles: readonly CardState[];
  readonly activeCharacterId: number;
  readonly hands: readonly CardState[];
  readonly characters: readonly CharacterState[];
  readonly combatStatuses: readonly EntityState[];
  readonly supports: readonly EntityState[];
  readonly summons: readonly EntityState[];
  readonly dice: readonly DiceType[];
  readonly declaredEnd: boolean;
  readonly hasDefeated: boolean;
  readonly canPlunging: boolean;
  readonly legendUsed: boolean;
  readonly skipNextTurn: boolean;
}

export interface CardState {
  readonly id: number;
  readonly definition: CardDefinition;
}

export interface CharacterState {
  readonly id: number;
  readonly definition: CharacterDefinition;
  readonly entities: readonly EntityState[];
  readonly variables: CharacterVariables;
}

export interface EntityState {
  readonly id: number;
  readonly definition: EntityDefinition;
  readonly variables: EntityVariables;
}
