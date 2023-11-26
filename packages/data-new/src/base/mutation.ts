import { Draft, produce } from "immer";

import { DiceType, PhaseType } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";
import {
  CardState,
  CharacterState,
  EntityState,
  GameState,
  PlayerState,
  SkillLogEntry,
} from "./state";
import {
  disposeEntity,
  getEntityArea,
  getEntityById,
  nextRandom,
} from "../util";
import { EntityArea } from "./entity";
import { SkillDefinition } from "./skill";

type Writable<T> = { -readonly [P in keyof T]: T[P] };

export interface StepRandomM {
  readonly type: "stepRandom";
  value: number; // output
}

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
  readonly caller: number;
  readonly skill: SkillDefinition;
}

export interface TransferCardM {
  readonly type: "transferCard";
  readonly path: "pilesToHands" | "handsToPiles";
  readonly who: 0 | 1;
  readonly value: CardState;
}

export interface SwitchActiveM {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly value: CharacterState;
}

export interface DisposeCardM {
  readonly type: "disposeCard";
  readonly who: 0 | 1;
  readonly used: boolean;
  readonly oldState: CardState;
}

export interface CreateCardM {
  readonly type: "createCard";
  readonly who: 0 | 1;
  readonly value: Writable<CardState>;
  readonly target: "hands" | "piles";
}

export interface CreateCharacterM {
  readonly type: "createCharacter";
  readonly who: 0 | 1;
  readonly value: Writable<CharacterState>;
}

export interface CreateEntityM {
  readonly type: "createEntity";
  readonly where: EntityArea;
  readonly value: Writable<EntityState>;
}

export interface DisposeEntityM {
  readonly type: "disposeEntity";
  readonly oldState: EntityState | CharacterState;
}

export interface ModifyEntityVarM {
  readonly type: "modifyEntityVar";
  readonly oldState: EntityState | CharacterState;
  readonly varName: string;
  readonly value: number;
}

export interface ResetDiceM {
  readonly type: "resetDice";
  readonly who: 0 | 1;
  readonly value: readonly DiceType[];
}

export type PlayerFlag = {
  [P in keyof PlayerState]: PlayerState[P] extends boolean ? P : never;
}[keyof PlayerState];

export interface SetPlayerFlagM {
  readonly type: "setPlayerFlag";
  readonly who: 0 | 1;
  readonly flagName: PlayerFlag;
  readonly value: boolean;
}

export type Mutation =
  | StepRandomM
  | ChangePhaseM
  | StepRoundM
  | SwitchTurnM
  | SetWinnerM
  | PushSkillM
  | TransferCardM
  | SwitchActiveM
  | DisposeCardM
  | CreateCardM
  | CreateCharacterM
  | CreateEntityM
  | DisposeEntityM
  | ModifyEntityVarM
  | ResetDiceM
  | SetPlayerFlagM;

function doMutation(state: GameState, m: Mutation): GameState {
  switch (m.type) {
    case "stepRandom": {
      return produce(state, (draft) => {
        [m.value, draft.iterators] = nextRandom(draft.iterators);
      });
    }
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
      const caller = getEntityById(state, m.caller, true);
      const area = getEntityArea(state, m.caller);
      const entry: SkillLogEntry = {
        roundNumber: state.roundNumber,
        caller,
        callerArea: area,
        skill: m.skill,
      };
      return produce(state, (draft) => {
        draft.skillLog.push(entry as Draft<SkillLogEntry>);
      });
    }
    case "transferCard": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const src = m.path === "pilesToHands" ? player.piles : player.hands;
        const dst = m.path === "pilesToHands" ? player.hands : player.piles;
        const cardIdx = src.findIndex((c) => c.id === m.value.id);
        if (cardIdx === -1) {
          throw new Error(`Card ${m.value.id} not found in source`);
        }
        const card = src[cardIdx];
        src.splice(cardIdx, 1);
        dst.push(card);
      });
    }
    case "switchActive": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        // const characterIdx = player.characters.findIndex((c) => c.id === m.targetId);
        // if (characterIdx === -1) {
        //   throw new Error(`Character ${targetId} not found in characters`);
        // }
        player.activeCharacterId = m.value.id;
      });
    }
    case "disposeCard": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const cardIdx = player.hands.findIndex((c) => c.id === m.oldState.id);
        if (cardIdx === -1) {
          throw new Error(`Card ${m.oldState.id} not found in hands`);
        }
        player.hands.splice(cardIdx, 1);
      });
    }
    case "createCard": {
      return produce(state, (draft) => {
        m.value.id = draft.iterators.id--;
        draft.players[m.who][m.target].push(m.value as Draft<CardState>);
      });
    }
    case "createCharacter": {
      return produce(state, (draft) => {
        m.value.id = draft.iterators.id--;
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
          value.id = draft.iterators.id--;
          character.entities.push(value as Draft<EntityState>);
        });
      } else {
        return produce(state, (draft) => {
          const area = draft.players[where.who][where.type];
          value.id = draft.iterators.id--;
          area.push(value as Draft<EntityState>);
        });
      }
    }
    case "disposeEntity": {
      return produce(state, (draft) => {
        disposeEntity(draft, m.oldState.id);
      });
    }
    case "modifyEntityVar": {
      return produce(state, (draft) => {
        const entity = getEntityById(draft, m.oldState.id, true) as Draft<
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

export function applyMutation(state: GameState, m: Mutation): GameState {
  return produce(doMutation(state, m), (draft) => {
    draft.mutationLog.push({
      roundNumber: state.roundNumber,
      mutation: m as Draft<Mutation>,
    });
  });
}
