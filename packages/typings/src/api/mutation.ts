// 与 base 中 mutation 几乎一致，但删去了具体的 state 信息

import { DiceType } from "../enums";
import { PhaseType, PlayerData } from "./notification";

interface ChangePhaseM {
  readonly type: "changePhase";
  readonly newPhase: PhaseType;
}

interface StepRoundM {
  readonly type: "stepRound";
}

interface SwitchTurnM {
  readonly type: "switchTurn";
}

interface SetWinnerM {
  readonly type: "setWinner";
  readonly winner: 0 | 1;
}

interface TransferCardM {
  readonly type: "transferCard";
  readonly path: "pilesToHands" | "handsToPiles";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface SwitchActiveM {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface DisposeCardM {
  readonly type: "disposeCard";
  readonly who: 0 | 1;
  readonly used: boolean;
  readonly id: number;
  readonly definitionId: number;
}

interface CreateCardM {
  readonly type: "createCard";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
  readonly target: "hands" | "piles";
}

interface CreateCharacterM {
  readonly type: "createCharacter";
  readonly who: 0 | 1;
  readonly id: number;
  readonly definitionId: number;
}

interface CreateEntityM {
  readonly type: "createEntity";
  readonly id: number;
  readonly definitionId: number;
}

interface DisposeEntityM {
  readonly type: "disposeEntity";
  readonly id: number;
  readonly definitionId: number;
}

interface ModifyEntityVarM {
  readonly type: "modifyEntityVar";
  readonly id: number;
  readonly definitionId: number;
  readonly varName: string;
  readonly value: number;
}

interface ResetDiceM {
  readonly type: "resetDice";
  readonly who: 0 | 1;
  readonly value: readonly DiceType[];
}

type PlayerFlag = "declareEnd" | "legendUsed";

interface SetPlayerFlagM {
  readonly type: "setPlayerFlag";
  readonly who: 0 | 1;
  readonly flagName: PlayerFlag;
  readonly value: boolean;
}

export type ExposedMutation =
  | ChangePhaseM
  | StepRoundM
  | SwitchTurnM
  | SetWinnerM
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
