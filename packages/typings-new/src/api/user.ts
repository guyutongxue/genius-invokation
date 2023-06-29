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
