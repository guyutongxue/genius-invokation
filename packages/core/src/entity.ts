import {
  EquipmentInfo,
  EventHandlers, PassiveSkillInfo, StatusInfo, SummonInfo, SupportInfo, getEquipment, getSkill, getStatus, getSummon, getSupport,
} from "@gi-tcg/data";
import { EventFactory } from "./context.js";
import { produce } from "immer";

const ENTITY_ID_BEGIN = -100;

let nextEntityId = ENTITY_ID_BEGIN;
export function newEntityId(): number {
  return nextEntityId--;
}

export type EntityType = "passive_skill" | "equipment" | "status" | "summon" | "support";

const ENTITY_INFO_GETTER = {
  passive_skill: (id: number): PassiveSkillInfo => {
    const info = getSkill(id);
    if (info.type !== "passive") throw new Error("Not a passive skill");
    return info;
  },
  equipment: getEquipment,
  status: getStatus,
  summon: getSummon,
  support: getSupport,
} satisfies Record<EntityType, (id: number) => any>;

export interface StatefulEntity<InfoT> {
  readonly entityId: number;
  readonly info: InfoT;
  readonly handler: EventHandlers;
  readonly state: any;
  readonly usagePerRound: number;
  readonly usage: number;
  readonly duration: number;
  readonly shouldDispose: boolean;
}
export type EquipmentState = StatefulEntity<EquipmentInfo>;
export type StatusState = StatefulEntity<StatusInfo>;
export type SupportState = StatefulEntity<SupportInfo>;
export type SummonState = StatefulEntity<SummonInfo>;
export type PassiveSkillState = StatefulEntity<PassiveSkillInfo>;

type InfoTypeOfEntity<T extends EntityType> = ReturnType<typeof ENTITY_INFO_GETTER[T]>;
type AllEntityState = StatefulEntity<InfoTypeOfEntity<EntityType>>;

export function createEntity<T extends EntityType>(type: T, id: number): StatefulEntity<InfoTypeOfEntity<T>> {
  const info = ENTITY_INFO_GETTER[type](id) as InfoTypeOfEntity<T>;
  return {
    entityId: newEntityId(),
    info,
    state: info.handler.state,
    handler: info.handler.handler,
    usage: "usage" in info ? info.usage : Infinity,
    usagePerRound: "usagePerRound" in info ? info.usagePerRound : Infinity,
    duration: "duration" in info ? info.duration : Infinity,
    shouldDispose: false,
  };
}

export async function handleEvent<T extends AllEntityState>(entity: T, event: EventFactory): Promise<T> {
  const candidates = event(entity.entityId);
  produce(entity, (draft) => {
    for (const [name, ctx] of candidates) {
      if (name === "onActionPhase") {
        this.onRoundBegin();
      }
      const h = entity.info.handler.handler[name];
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
  })
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
