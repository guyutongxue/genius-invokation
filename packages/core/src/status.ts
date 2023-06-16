import { StatusInfoWithName, statusSymbol, IStatus } from "@jenshin-tcg/data";
import { StatusFacade } from ".";

let nextStatusId = 6000000;

export class Status {
  readonly objectId: number;
  readonly id: number;
  readonly handlers: IStatus;

  constructor(ctor: any, ...args: any[]) {
    const info: StatusInfoWithName = ctor[statusSymbol];
    if (!info) {
      throw new Error("Cannot find info about this status");
    }
    this.objectId = info.objectId;
    this.id = nextStatusId++;
    this.handlers = new ctor(...args);
  }
  
  handle<K extends keyof IStatus>(event: K, ...c: Parameters<Required<IStatus>[K]>) {
    const handler = this.handlers[event];
    if (handler) {
      // @ts-expect-error Shamefully ignore the type check
      handler(...c);
    }
  }

  toFacade(): StatusFacade {
    return {
      objectId: this.objectId,
      id: this.id,
      // TODO: value
    }
  }
}
