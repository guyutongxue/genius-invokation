import { Draft, produce } from "immer";

import { DiceType, PhaseType } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";
import {
  CardState,
  CharacterState,
  EntityState,
  GameState,
  PlayerState,
} from "./state";
import {
  disposeEntity,
  getEntityArea,
  getEntityById,
  nextRandom,
  sortDice,
} from "../util";
import { EntityArea, EntityDefinition } from "./entity";
import { ActionInfo, DamageInfo, SkillDefinition, SkillInfo } from "./skill";
import { CharacterDefinition } from "./character";
import { CardDefinition } from "./card";
import { GiTcgCoreInternalError } from "../error";

type IdWritable<T extends { readonly id: number }> = Omit<T, "id"> & {
  id: number;
};

export interface ExtendDataM {
  readonly type: "extendData";
  readonly cards: readonly CardDefinition[];
  readonly characters: readonly CharacterDefinition[];
  readonly entities: readonly EntityDefinition[];
  readonly skills: readonly SkillDefinition[];
}

export interface ClearMutationLogM {
  readonly type: "clearMutationLog";
}

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

export interface PushActionLogM {
  readonly type: "pushActionLog";
  readonly who: 0 | 1;
  readonly action: ActionInfo;
}

export interface PushDamageLogM {
  readonly type: "pushDamageLog";
  readonly damage: DamageInfo;
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
  readonly value: IdWritable<CardState>;
  readonly target: "hands" | "piles";
}

export interface CreateCharacterM {
  readonly type: "createCharacter";
  readonly who: 0 | 1;
  readonly value: IdWritable<CharacterState>;
}

export interface CreateEntityM {
  readonly type: "createEntity";
  readonly where: EntityArea;
  readonly value: IdWritable<EntityState>;
}

export interface DisposeEntityM {
  readonly type: "disposeEntity";
  readonly oldState: EntityState | CharacterState;
}

export interface ModifyEntityVarM {
  readonly type: "modifyEntityVar";
  state: EntityState | CharacterState;
  readonly varName: string;
  readonly value: number;
}

export interface ReplaceCharacterDefinitionM {
  readonly type: "replaceCharacterDefinition";
  state: CharacterState;
  readonly newDefinition: CharacterDefinition;
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
  | ExtendDataM
  | ClearMutationLogM
  | StepRandomM
  | ChangePhaseM
  | StepRoundM
  | SwitchTurnM
  | SetWinnerM
  | PushActionLogM
  | PushDamageLogM
  | TransferCardM
  | SwitchActiveM
  | DisposeCardM
  | CreateCardM
  | CreateCharacterM
  | CreateEntityM
  | DisposeEntityM
  | ModifyEntityVarM
  | ReplaceCharacterDefinitionM
  | ResetDiceM
  | SetPlayerFlagM;

function doMutation(state: GameState, m: Mutation): GameState {
  switch (m.type) {
    case "extendData": {
      return produce(state, (draft) => {
        for (const c of m.characters) {
          draft.data.characters.set(c.id, c as Draft<CharacterDefinition>);
        }
        for (const e of m.entities) {
          draft.data.entities.set(e.id, e as Draft<EntityDefinition>);
        }
        for (const s of m.skills) {
          draft.data.skills.set(s.id, s as Draft<SkillDefinition>);
        }
        for (const c of m.cards) {
          draft.data.cards.set(c.id, c as Draft<CardDefinition>);
        }
      });
    }
    case "clearMutationLog": {
      return produce(state, (draft) => {
        draft.mutationLog = [];
      });
    }
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
    case "pushActionLog": {
      return produce(state, (draft) => {
        draft.globalActionLog.push({
          roundNumber: draft.roundNumber,
          who: m.who,
          action: m.action as Draft<ActionInfo>,
        });
      });
    }
    case "pushDamageLog": {
      return produce(state, (draft) => {
        const character = getEntityById(
          draft,
          m.damage.target.id,
          true,
        ) as Draft<CharacterState>;
        character.damageLog.push(m.damage as Draft<DamageInfo>);
      });
    }
    case "transferCard": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const src = m.path === "pilesToHands" ? player.piles : player.hands;
        const dst = m.path === "pilesToHands" ? player.hands : player.piles;
        const cardIdx = src.findIndex((c) => c.id === m.value.id);
        if (cardIdx === -1) {
          throw new GiTcgCoreInternalError(`Card ${m.value.id} not found in source`);
        }
        const card = src[cardIdx];
        src.splice(cardIdx, 1);
        dst.push(card);
      });
    }
    case "switchActive": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        player.activeCharacterId = m.value.id;
      });
    }
    case "disposeCard": {
      return produce(state, (draft) => {
        const player = draft.players[m.who];
        const cardIdx = player.hands.findIndex((c) => c.id === m.oldState.id);
        if (cardIdx === -1) {
          throw new GiTcgCoreInternalError(`Card ${m.oldState.id} not found in hands`);
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
            throw new GiTcgCoreInternalError(`Character ${where.characterId} not found`);
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
      const newState = produce(state, (draft) => {
        const entity = getEntityById(draft, m.state.id, true) as Draft<
          CharacterState | EntityState
        >;
        entity.variables[m.varName] = m.value;
      });
      m.state = getEntityById(newState, m.state.id, true);
      return newState;
    }
    case "replaceCharacterDefinition": {
      const newState = produce(state, (draft) => {
        const character = getEntityById(
          draft,
          m.state.id,
          true,
        ) as Draft<CharacterState>;
        character.definition = m.newDefinition as Draft<CharacterDefinition>;
      });
      m.state = getEntityById(newState, m.state.id, true) as CharacterState;
      return newState;
    }
    case "resetDice": {
      return produce(state, (draft) => {
        draft.players[m.who].dice = sortDice(state.players[m.who], m.value);
      });
    }
    case "setPlayerFlag": {
      return produce(state, (draft) => {
        draft.players[m.who][m.flagName] = m.value;
      });
    }
    default: {
      const _: never = m;
      throw new GiTcgCoreInternalError(`Unknown mutation type: ${JSON.stringify(m)}`);
    }
  }
}

export function applyMutation(state: GameState, m: Mutation): GameState {
  return produce(doMutation(state, m), (draft) => {
    draft.mutationLog.push({
      roundNumber: state.roundNumber,
      mutation: { ...m } as Draft<Mutation>,
    });
  });
}
