import {
  EquipmentInfo,
  EventHandlers,
  PassiveSkillInfo,
  StatusInfo,
  SummonInfo,
  SupportInfo,
  SyncHandlerResult,
  getEquipment,
  getSkill,
  getStatus,
  getSummon,
  getSupport,
} from "@gi-tcg/data";
import { EventFactory } from "./context.js";
import { produce } from "immer";

const ENTITY_ID_BEGIN = -100;

let nextEntityId = ENTITY_ID_BEGIN;
export function newEntityId(): number {
  return nextEntityId--;
}

export type EntityType =
  | "passive_skill"
  | "equipment"
  | "status"
  | "summon"
  | "support";

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

type InfoTypeOfEntity<T extends EntityType> = ReturnType<
  (typeof ENTITY_INFO_GETTER)[T]
>;
export type AllEntityState = StatefulEntity<InfoTypeOfEntity<EntityType>>;

export function createEntity<T extends EntityType>(
  type: T,
  id: number
): StatefulEntity<InfoTypeOfEntity<T>> {
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

interface PlayerEntityPath {
  who: 0 | 1;
  type: "status" | "summon" | "support";
  entityId: number;
  indexHint: number;
}

type VirtualEntityPath =
  | {
      who: 0 | 1;
      type: "skill";
      characterId: number;
      id: number;
    }
  | {
      who: 0 | 1;
      type: "card";
      id: number;
    };

interface CharacterEntityPath {
  who: 0 | 1;
  type: "passive_skill" | "equipment" | "status";
  characterEntityId: number;
  characterIndexHint: number;
  entityId: number;
  indexHint: number;
}

export type EntityPath =
  | PlayerEntityPath
  | VirtualEntityPath
  | CharacterEntityPath;

export function handleSyncEvent<T extends AllEntityState>(
  entity: T,
  event: EventFactory
): T {
  const candidates = event(entity.entityId);
  return produce(entity, (draft) => {
    let r: SyncHandlerResult = undefined;
    for (const [name, ctx] of candidates) {
      if (name === "onActionPhase") {
        draft.duration--;
        if (draft.duration <= 0) {
          draft.shouldDispose = true;
        } else if ("usagePerRound" in draft.info) {
          draft.usagePerRound = draft.info.usagePerRound;
        }
      }
      const h = entity.info.handler.handler[name];
      if (
        typeof h !== "undefined" &&
        !draft.shouldDispose &&
        draft.usagePerRound > 0
      ) {
        ctx.this;
        const result = h(ctx as any);
        if (typeof result === "object" && "then" in result) {
          throw new Error("Cannot handle async event in sync mode");
        }
        r = result;
        break;
      }
    }
    if (typeof r === "undefined" || r === true) {
      draft.usage--;
      draft.usagePerRound--;
      if (draft.usage <= 0) {
        draft.shouldDispose = true;
      }
    }
  });
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
