import { Context } from "../contexts";
import { IGlobalEvents } from "./global";

export interface CardInfo {
  readonly objectId: number;
}

export interface ICard extends IGlobalEvents {
  enabled?: boolean;

  onUse(c: Context): void;
}
