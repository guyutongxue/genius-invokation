import { CharacterData, CardData, StatusData } from "./decorators";

export const characterList: CharacterData[] = [];
export const statusList: StatusData[] = [];
export const cardList: CardData[] = [];

export function getCharacterData(objectId: number) {
  return characterList.find((c) => c.info.objectId === objectId);
}

export function getStatusData(objectId: number) {
  return statusList.find((c) => c.info.objectId === objectId);
}

export function getCardData(objectId: number) {
  return cardList.find((c) => c.info.objectId === objectId);
}
