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
  SHIELD_VALUE,
  SkillInfo,
  CardInfo,
  NormalSkillInfo,
} from "@gi-tcg/data";
import { AnyEventDescriptor } from "./context.js";
import { Draft, produce } from "immer";
import { EntityData } from "@gi-tcg/typings";
import { CharacterPath } from "./character.js";

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

type EntityTypeMap = {
  [T in EntityType]: ReturnType<(typeof ENTITY_INFO_GETTER)[T]>;
};

export type StateOfEntity<T extends EntityType> = StatefulEntity<
  EntityTypeMap[T]
>;
export type AllEntityInfo = EntityTypeMap[EntityType];
export type AllEntityState = StatefulEntity<AllEntityInfo>;

export function createEntity<T extends EntityType>(
  type: T,
  id: number,
): StatefulEntity<EntityTypeMap[T]> {
  const info = ENTITY_INFO_GETTER[type](id) as EntityTypeMap[T];
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

export interface PlayerEntityPath {
  who: 0 | 1;
  type: "status" | "summon" | "support";
  entityId: number;
  indexHint: number;
  info: StatusInfo | SummonInfo | SupportInfo;
}

export interface SkillPath {
  who: 0 | 1;
  type: "skill";
  character: CharacterPath;
  info: NormalSkillInfo;
  charged: boolean;
  plunging: boolean;
}
export interface CardPath {
  who: 0 | 1;
  type: "card";
  entityId: number;
  info: CardInfo;
}
export type VirtualEntityPath = SkillPath | CardPath;

export interface CharacterEntityPath {
  who: 0 | 1;
  type: "passive_skill" | "equipment" | "status";
  character: CharacterPath;
  entityId: number;
  indexHint: number;
  info: PassiveSkillInfo | EquipmentInfo | StatusInfo;
}

export type EntityPath =
  | PlayerEntityPath
  | VirtualEntityPath
  | CharacterEntityPath;

export type EntityUpdateFn<T extends AllEntityState = AllEntityState> = (
  draft: Draft<T>,
  path: EntityPath,
) => void;

export function getVisibleValue(entity: AllEntityState): number | null;
export function getVisibleValue(
  entity: AllEntityState,
  newValue: number,
): EntityUpdateFn;
export function getVisibleValue(
  entity: AllEntityState,
  newValue?: number,
): number | null | EntityUpdateFn {
  if ("prepare" in entity.info && entity.info.prepare !== null) {
    if (typeof newValue === "number") {
      throw new Error("Cannot set value of prepare entity");
    }
    return entity.info.prepare.round;
  }
  if ("usage" in entity.info && Number.isFinite(entity.usage)) {
    if (typeof newValue === "number") {
      return (draft) => {
        draft.usage = newValue;
      };
    }
    return entity.usage;
  }
  if ("duration" in entity.info && Number.isFinite(entity.duration)) {
    if (typeof newValue === "number") {
      return (draft) => {
        draft.duration = newValue;
      };
    }
    return entity.duration;
  }
  if (SHIELD_VALUE in entity.state) {
    if (typeof newValue === "number") {
      return (draft) => {
        draft.state[SHIELD_VALUE] = newValue;
      };
    }
    return entity.state[SHIELD_VALUE];
  }
  for (const [k, v] of Object.entries(entity.state)) {
    if (!k.startsWith("_") && typeof v === "number" && Number.isFinite(v)) {
      if (typeof newValue === "number") {
        return (draft) => {
          draft.state[k] = newValue;
        };
      }
      return v;
    }
  }
  if (typeof newValue === "number") {
    throw new Error("This entity has no visible value");
  }
  return null;
}

export function refreshEntity(entity: Draft<SummonState> | Draft<StatusState>) {
  entity.shouldDispose = false;
  entity.usage = Math.min(
    entity.usage + entity.info.usage,
    entity.info.maxUsage,
  );
  if ("usagePerRound" in entity.info) {
    entity.usagePerRound = entity.info.usagePerRound;
  }
  if ("duration" in entity.info) {
    entity.duration = entity.info.duration;
  }
  if ("shield" in entity.info && entity.info.shield !== null) {
    entity.state[SHIELD_VALUE] = Math.min(
      Number(entity.state[SHIELD_VALUE]) + entity.info.shield.initial,
      entity.info.shield.recreateMax,
    );
  }
}

export function getEntityData(entity: AllEntityState): EntityData {
  return {
    entityId: entity.entityId,
    id: entity.info.id,
    value: getVisibleValue(entity) ?? undefined,
  };
}
