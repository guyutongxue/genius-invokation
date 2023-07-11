import {
  ContextOfEvent,
  EventHandlerNames,
  EventHandlers,
  HandlerResult,
} from "@gi-tcg/data";
import { EventAndContext, EventFactory } from "./context.js";

const ENTITY_ID_BEGIN = 5.6e7;

let nextEntityId = ENTITY_ID_BEGIN;
function newEntityId(): number {
  return nextEntityId++;
}

export class Entity {
  public readonly entityId: number;
  constructor(protected readonly id: number) {
    this.entityId = newEntityId();
  }
  protected async doHandleEvent(
    handler: EventHandlers,
    event: EventAndContext | EventFactory
  ): Promise<boolean> {
    let r: boolean | undefined;
    if (Array.isArray(event)) {
      const [name, ctx] = event;
      const h = handler[name];
      if (typeof h !== "undefined") {
        // @ts-ignore
        r = await h.call(handler, ctx);
      }
    } else {
      const candidates = event(this);
      for (const [name, ctx] of candidates) {
        const h = handler[name];
        if (typeof h !== "undefined") {
          // @ts-ignore
          r = await h.call(handler, ctx);
          break;
        }
      }
    }
    if (typeof r === "undefined") {
      return true;
    } else {
      return r;
    }
  }
}

// 浅拷贝（只克隆一层）
// 因此，需要调用所有成员的 clone 方法
// 如果有基类的话同理！
export function shallowClone<T extends object>(obj: T): T {
  if (Object.hasOwn(obj, ClonedObj)) {
    console.warn("shallowClone: object has been cloned");
  }
  const cloned = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
  Object.defineProperty(cloned, ClonedObj, {
    value: true,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  return cloned;
}

// 已克隆对象的标记符号：防止不必要的重复克隆
export const ClonedObj: unique symbol = Symbol("ClonedObj");
