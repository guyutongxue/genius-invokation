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

export * from "./common_enums";
export {
  CardState as PbCardState,
  CharacterState as PbCharacterState,
  EntityState as PbEntityState,
  PlayerState as PbPlayerState,
  SkillInfo as PbSkillInfo,
  State as PbGameState,
  EquipmentType as PbEquipmentType,
  Notification,
} from "./gen/notification";
export { PreviewData } from "./gen/preview";
export {
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  RerollDiceRequest,
  RerollDiceResponse,
  SelectCardRequest,
  SelectCardResponse,
  SwitchHandsRequest,
  SwitchHandsResponse,
  Request as GiTcgRequest,
  Response as GiTcgResponse,
} from "./gen/rpc";
export {
  CardArea as PbCardArea,
  ActionType as PbActionType,
  PhaseType as PbPhaseType,
  PlayerStatus as PbPlayerStatus,
  RemoveCardReason as PbRemoveCardReason,
  ActionDoneEM,
  ChangePhaseEM,
  CreateCardEM,
  CreateCharacterEM,
  CreateEntityEM,
  DamageEM,
  ElementalReactionEM,
  ModifyEntityVarEM,
  PlayerStatusChangeEM,
  RemoveCardEM,
  RemoveEntityEM,
  ResetDiceEM,
  SetWinnerEM,
  StepRoundEM,
  SwitchActiveEM,
  SwitchTurnEM,
  TransferCardEM,
  TransformDefinitionEM,
  TriggeredEM,
  ExposedMutation
} from "./gen/mutation";
