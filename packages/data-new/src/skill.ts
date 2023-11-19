import { GameState } from "./state";


export type EventHandlers = unknown;

export type SkillDescription = (state: GameState) => GameState;

export type SkillFilter = (state: GameState) => boolean;
