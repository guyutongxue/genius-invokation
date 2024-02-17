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

import type { StateData } from "./notification";

export interface UserReady {
  type: "userReady";
}
export interface UserGiveUpRequest {
  type: "userGiveUp";
}
export interface UserPreviewRequest {
  type: "userPreview";
}
export interface CommonResponse {
  success: boolean;
}
export type UserPreviewResponse = {
  success: true;
  state: StateData;
} | {
  success: false;
  reason: string;
}
export type UserResponseMap = {
  userReady: CommonResponse;
  userGiveUp: CommonResponse;
  userPreview: UserPreviewResponse;
}
export type UserRequest = UserGiveUpRequest | UserPreviewRequest;
export type UserResponse<Req extends UserRequest = UserRequest> = UserResponseMap[Req["type"]];
