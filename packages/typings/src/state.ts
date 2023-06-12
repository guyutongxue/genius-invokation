import { Aura, DiceType } from "./elements";

export interface CharacterFacade {
  id: number;
  health: number;
  energy: number;
  weapon?: number;
  artifact?: number;
  equipments: number[];
  statuses: StatusFacade[];
  applied: Aura;
}

export interface StatusFacade {
  id: number;
  value?: number;
}

export interface SupportFacade {
  id: number;
  value?: number;
}

export interface SummonFacade {
  id: number;
  value: number;
}

export type GlobalEffect = {
  type: "fastSwitch"
}

// export interface CardFacade {
//   id: number;
// }

export interface StateFacade {
  pileNumber: number;
  hands: number[],
  active?: number;
  characters: CharacterFacade[];
  combatStatuses: StatusFacade[];
  supports: SupportFacade[];
  summons: SummonFacade[];
  dice: DiceType[];
  globalEffects: GlobalEffect[],
  peerPileNumber: number;
  peerHandsNumber: number;
  peerActive?: number;
  peerCharacters: CharacterFacade[];
  peerCombatStatuses: StatusFacade[];
  peerSupports: SupportFacade[];
  peerSummons: SummonFacade[];
  peerDiceNumber: number;
}
