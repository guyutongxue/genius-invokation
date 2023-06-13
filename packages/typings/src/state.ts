import { Aura, DiceType } from "./elements";

export interface CharacterFacade {
  readonly id: number;
  readonly objectId: number;
  health: number;
  energy: number;
  weapon?: number;
  artifact?: number;
  equipments: number[];
  statuses: StatusFacade[];
  applied: Aura;
}

export interface StatusFacade {
  readonly id: number;
  readonly objectId: number;
  value?: number;
}

export interface SupportFacade {
  readonly id: number;
  readonly objectId: number;
  value?: number;
}

export interface SummonFacade {
  readonly id: number;
  readonly typeId: number;
  value: number;
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
  peerPileNumber: number;
  peerHandsNumber: number;
  peerActive?: number;
  peerCharacters: CharacterFacade[];
  peerCombatStatuses: StatusFacade[];
  peerSupports: SupportFacade[];
  peerSummons: SummonFacade[];
  peerDiceNumber: number;
}
