import {
  EquipmentInfoWithId,
  EventHandlers, PassiveSkillInfo, PassiveSkillInfoWithId, StatusInfoWithId, SummonInfoWithId, SupportInfoWithId, getEquipment, getSkill, getStatus, getSummon, getSupport,
} from "@gi-tcg/data";
import { EventFactory } from "./context.js";

const ENTITY_ID_BEGIN = -100;

let nextEntityId = ENTITY_ID_BEGIN;
export function newEntityId(): number {
  return nextEntityId--;
}

export type EntityType = "passive_skill" | "equipment" | "status" | "summon" | "support";


const ENTITY_DEFAULT = {
  handler: {},
  usagePerRound: Infinity,
  usage: Infinity,
  duration: Infinity,
  shouldDispose: false,
} satisfies Partial<StatefulEntity<unknown>>;


const ENTITY_INFO_GETTER = {
  passive_skill: (id: number): PassiveSkillInfoWithId => {
    const info = getSkill(id);
    if (info.type !== "passive") throw new Error("Not a passive skill");
    return info;
  },
  equipment: getEquipment,
  status: getStatus,
  summon: getSummon,
  support: getSupport,
} satisfies Record<EntityType, (id: number) => any>;

interface StatefulEntity<InfoT> {
  readonly entityId: number;
  readonly info: InfoT;
  readonly handler: EventHandlers;
  readonly usagePerRound: number;
  readonly usage: number;
  readonly duration: number;
  readonly shouldDispose: boolean;
}
export type EquipmentState = StatefulEntity<EquipmentInfoWithId>;
export type StatusState = StatefulEntity<StatusInfoWithId>;
export type SupportState = StatefulEntity<SupportInfoWithId>;
export type SummonState = StatefulEntity<SummonInfoWithId>;
export type PassiveSkillState = StatefulEntity<PassiveSkillInfo>;

type InfoTypeOfEntity<T extends EntityType> = ReturnType<typeof ENTITY_INFO_GETTER[T]>;

function createEntity<T extends EntityType>(type: T, id: number): StatefulEntity<InfoTypeOfEntity<T>> {
  const info: InfoTypeOfEntity<T> = ENTITY_INFO_GETTER[type](id);
  return {
    entityId: newEntityId(),
    info,
  };
}

export class Entity {
  public readonly entityId: number;
  constructor(protected readonly id: number) {
    this.entityId = newEntityId();
  }

  protected onRoundBegin() {
    return;
  }

  protected async doHandleEvent(
    handler: EventHandlers,
    event: EventFactory
  ): Promise<boolean> {
    let r: boolean | undefined = false;
    const candidates = event(this.entityId);
    for (const [name, ctx] of candidates) {
      if (name === "onActionPhase") {
        this.onRoundBegin();
      }
      const h = handler[name];
      if (typeof h !== "undefined") {
        // @ts-expect-error TS SUCKS
        r = await h.call(handler, ctx);
        break;
      }
    }
    if (typeof r === "undefined") {
      return true;
    } else {
      return r;
    }
  }
  protected doHandleEventSync(handler: EventHandlers, event: EventFactory) {
    let r: boolean | undefined = false;
    const candidates = event(this.entityId);
    for (const [name, ctx] of candidates) {
      if (name === "onActionPhase") {
        this.onRoundBegin();
      }
      const h = handler[name];
      if (typeof h !== "undefined") {
        // @ts-expect-error TS SUCKS
        const currentR = h.call(handler, ctx);
        if (typeof currentR === "object" && "then" in currentR) {
          throw new Error("Cannot handle async event in sync mode");
        }
        r = currentR ?? undefined;
        break;
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
