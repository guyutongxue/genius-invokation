import { Draft, produce } from "immer";

import { DiceType, PhaseType } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { disposeEntity, getEntityById } from "../util";
import { EntityArea } from "./entity";

export interface ChangePhaseM {
  readonly type: "changePhase";
  readonly newPhase: PhaseType;
}

export interface StepRoundM {
  readonly type: "stepRound";
}

export interface SwitchTurnM {
  readonly type: "switchTurn";
}

export interface SetWinnerM {
  readonly type: "setWinner";
  readonly winner: 0 | 1;
}

export interface PushSkillM {
  readonly type: "pushSkill";
  // TODO
}

export interface ExtractPileToHandM {
  readonly type: "extractPileToHand";
  readonly who: 0 | 1;
  readonly cardId: number;
}

export interface SwitchActiveM {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly targetId: number;
}

export interface DisposeCardM {
  readonly type: "disposeCard";
  readonly who: 0 | 1;
  readonly cardId: number;
}

export interface CreateCardM {
  readonly type: "createCard";
  readonly who: 0 | 1;
  readonly value: CardState;
  readonly target: "hands" | "piles";
}

export interface CreateCharacterM {
  readonly type: "createCharacter";
  readonly who: 0 | 1;
  readonly value: CharacterState;
}

export interface CreateEntityM {
  readonly type: "createEntity";
  readonly where: EntityArea;
  readonly value: EntityState;
}

export interface DisposeEntityM {
  readonly type: "disposeEntity";
  readonly id: number;
}

export interface ModifyEntityVarM {
  readonly type: "modifyEntityVar";
  readonly id: number;
  readonly varName: string;
  readonly value: number;
}

export interface ResetDiceM {
  readonly type: "resetDice";
  readonly who: 0 | 1;
  readonly value: readonly DiceType[];
}

export interface SetPlayerFlagM {
  readonly type: "setPlayerFlag";
  readonly who: 0 | 1;
  readonly flagName: "declaredEnd" | "legendUsed" | "skipNextTurn";
  readonly value: boolean;
}

export type Mutation =
  | ChangePhaseM
  | StepRoundM
  | SwitchTurnM
  | SetWinnerM
  | PushSkillM
  | ExtractPileToHandM
  | SwitchActiveM
  | DisposeCardM
  | CreateCardM
  | CreateCharacterM
  | CreateEntityM
  | DisposeEntityM
  | ModifyEntityVarM
  | ResetDiceM
  | SetPlayerFlagM;

export function applyMutation(state: GameState, m: Mutation): GameState {
  state = produce(state, (draft) => {
    draft.mutationLog.push(m as Draft<Mutation>);
  });
  switch (m.type) {
    case "changePhase": {
      return produce(state, (draft) => {
        draft.phase = m.newPhase;
      });
    }
    case "stepRound": {
      return produce(state, (draft) => {
        draft.roundNumber++;
      });
    }
    case "switchTurn": {
      return produce(state, (draft) => {
        draft.currentTurn = flip(draft.currentTurn);
      });
    }
    case "setWinner": {
      return produce(state, (draft) => {
        draft.winner = m.winner;
      });
    }
    case "pushSkill": {
      // TODO
      return state;
    }
    case "extractPileToHand": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const cardIdx = player.piles.findIndex((c) => c.id === m.cardId);
        if (cardIdx === -1) {
          throw new Error(`Card ${m.cardId} not found in pile`);
        }
        const card = player.piles[cardIdx];
        player.piles.splice(cardIdx, 1);
        player.hands.push(card);
      });
    }
    case "switchActive": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        // const characterIdx = player.characters.findIndex((c) => c.id === m.targetId);
        // if (characterIdx === -1) {
        //   throw new Error(`Character ${targetId} not found in characters`);
        // }
        player.activeCharacterId = m.targetId;
      });
    }
    case "disposeCard": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const cardIdx = player.hands.findIndex((c) => c.id === m.cardId);
        if (cardIdx === -1) {
          throw new Error(`Card ${m.cardId} not found in hands`);
        }
        player.hands.splice(cardIdx, 1);
      });
    }
    case "createCard": {
      return produce(state, (draft) => {
        draft.players[m.who][m.target].push(m.value as Draft<CardState>);
      });
    }
    case "createCharacter": {
      return produce(state, (draft) => {
        draft.players[m.who].characters.push(m.value as Draft<CharacterState>);
      });
    }
    case "createEntity": {
      const { where, value } = m;
      if (where.type === "characters") {
        return produce(state, (draft) => {
          const character = draft.players[where.who].characters.find(
            (c) => c.id === where.characterId,
          );
          if (!character) {
            throw new Error(`Character ${where.characterId} not found`);
          }
          character.entities.push(value);
        });
      } else {
        return produce(state, (draft) => {
          const area = draft.players[where.who][where.type];
          area.push(value);
        });
      }
    }
    case "disposeEntity": {
      return produce(state, (draft) => {
        disposeEntity(draft, m.id);
      });
    }
    case "modifyEntityVar": {
      return produce(state, (draft) => {
        const entity = getEntityById(draft, m.id, true) as Draft<
          CharacterState | EntityState
        >;
        entity.variables[m.varName] = m.value;
      });
    }
    case "resetDice": {
      return produce(state, (draft) => {
        draft.players[m.who].dice = m.value as DiceType[];
      });
    }
    case "setPlayerFlag": {
      return produce(state, (draft) => {
        draft.players[m.who][m.flagName] = m.value;
      });
    }
    default: {
      const _: never = m;
      throw new Error(`Unknown mutation type: ${JSON.stringify(m)}`);
    }
  }
}
