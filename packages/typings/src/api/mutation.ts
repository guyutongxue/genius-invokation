// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import type { DamageType, DiceType, Reaction } from "../enums";
import type { PhaseType } from "./notification";

// 以下部分与 base 中 mutation 几乎一致，但删去了具体的 state 信息

interface ChangePhaseEM {
  readonly type: "changePhase";
  readonly newPhase: PhaseType;
}

interface StepRoundEM {
  readonly type: "stepRound";
}

interface SwitchTurnEM {
  readonly type: "switchTurn";
}

interface SetWinnerEM {
  readonly type: "setWinner";
  readonly winner: 0 | 1;
}

interface TransferCardEM {
  readonly type: "transferCard";
  readonly path: "pilesToHands" | "handsToPiles";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface SwitchActiveEM {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface DisposeCardEM {
  readonly type: "disposeCard";
  readonly who: 0 | 1;
  readonly used: boolean;
  readonly id: number;
  readonly definitionId: number;
}

interface CreateCardEM {
  readonly type: "createCard";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
  readonly target: "hands" | "piles";
}

interface CreateCharacterEM {
  readonly type: "createCharacter";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface CreateEntityEM {
  readonly type: "createEntity";
  readonly id: number;
  readonly definitionId: number;
}

interface DisposeEntityEM {
  readonly type: "disposeEntity";
  readonly id: number;
  readonly definitionId: number;
}

interface ModifyEntityVarEM {
  readonly type: "modifyEntityVar";
  readonly id: number;
  readonly definitionId: number;
  readonly varName: string;
  readonly value: number;
}

interface ReplaceCharacterDefinitionEM {
  readonly type: "replaceCharacterDefinition";
  readonly id: number;
  readonly newDefinitionId: number;
}

interface ResetDiceEM {
  readonly type: "resetDice";
  readonly who: 0 | 1;
  readonly value: readonly DiceType[];
}

type PlayerFlagEM = "declareEnd" | "legendUsed";

interface SetPlayerFlagEM {
  readonly type: "setPlayerFlag";
  readonly who: 0 | 1;
  readonly flagName: PlayerFlagEM;
  readonly value: boolean;
}

// 以下部分为 base 中 mutations 不包含的，更上层的“primitive”修改

export interface DamageData {
  type: DamageType;
  value: number;
  target: number;
}
export interface DamageEM {
  type: "damage";
  damage: DamageData;
}
export interface ElementalReactionEM {
  type: "elementalReaction";
  on: number;
  reactionType: Reaction;
}
export interface UseCommonSkillEM {
  type: "useCommonSkill";
  skill: number;
  who: 0 | 1;
}
export interface TriggeredEM {
  type: "triggered";
  id: number;
}
export interface OppStatusEM {
  type: "oppChoosingActive" | "oppAction"
}

export type ExposedMutation =
  | ChangePhaseEM
  | StepRoundEM
  | SwitchTurnEM
  | SetWinnerEM
  | TransferCardEM
  | SwitchActiveEM
  | DisposeCardEM
  | CreateCardEM
  | CreateCharacterEM
  | CreateEntityEM
  | DisposeEntityEM
  | ModifyEntityVarEM
  | ReplaceCharacterDefinitionEM
  | ResetDiceEM
  | SetPlayerFlagEM
  | DamageEM
  | ElementalReactionEM
  | UseCommonSkillEM
  | TriggeredEM
  | OppStatusEM;

/** @deprecated use `ExposedMutation` instead. */
export type Event = ExposedMutation;
