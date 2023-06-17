import { StatusInfoWithName, statusSymbol, IStatus } from "@jenshin-tcg/data";
import { StatusFacade } from ".";

let nextStatusId = 6000000;

export class Status {
  readonly objectId: number;
  readonly id: number;
  private usage: number;
  private duration: number;
  private shouldDisposeBit = false;
  readonly handlers: IStatus;

  constructor(ctor: any, ...args: any[]) {
    const info: StatusInfoWithName = ctor[statusSymbol];
    if (!info) {
      throw new Error("Cannot find info about this status");
    }
    this.objectId = info.objectId;
    this.id = nextStatusId++;
    this.usage = info.usage ?? Infinity;
    this.duration = info.duration ?? Infinity;
    this.handlers = new ctor(...args);
  }
  
  handle<K extends keyof IStatus>(event: K, c: Parameters<Required<IStatus>[K]>[0], deductUsage = true) {
    const handler = this.handlers[event];
    if (handler) {
      // @ts-ignore
      const result = handler(c);
      if (deductUsage && result) {
        this.usage--;
        if (this.usage <= 0) {
          this.shouldDisposeBit = true;
        }
      }
    }
  }

  toFacade(): StatusFacade {
    return {
      objectId: this.objectId,
      id: this.id,
      // TODO: value
    }
  }

  get shouldDispose() {
    return this.shouldDisposeBit;
  }
}
