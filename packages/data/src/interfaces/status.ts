import { IGlobalEvents } from "./global";

export interface StatusInfo {
  readonly objectId: number;
  readonly duration?: number;
  readonly usage?: number;
  readonly visibleProp?: string;
}

export interface IStatus extends IGlobalEvents {
}

export interface IStatusConstructor {
  new (...args: any[]): IStatus;
}
