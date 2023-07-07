import { ContextOfEvent, EventHandlers } from "@gi-tcg/data";

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
  protected static async handleEvent<E extends keyof EventHandlers>(
    handler: EventHandlers,
    e: E,
    ctx: ContextOfEvent<E>
  ): Promise<boolean> {
    if (e === "onUseSkill") {
      const ctx2 = ctx as ContextOfEvent<"onUseSkill">;
      if (ctx2.damage) {
        Entity.handleEvent(handler, "onDealDamage", ctx2.damage);
        if (ctx2.damage.reaction) {
          Entity.handleEvent(handler, "onElementalReaction", ctx2.damage.reaction);
        }
      }
    }
    if (typeof handler[e] !== "function") {
      return false;
    }
    // @ts-ignore
    const r = await handler[e](ctx);
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
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}
