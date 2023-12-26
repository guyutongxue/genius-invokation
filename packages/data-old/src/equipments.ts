import { EquipmentHandle } from "./builders";
import { EntityContext } from "./entities";
import { EventHandlerAndState, ListenTarget } from "./events";

export type EquipmentType = "weapon" | "artifact" | "other";

type EquipmentInfoNoId = Omit<EquipmentInfo, "id">;

export interface EquipmentInfo {
  readonly id: number;
  readonly type: EquipmentType;
  readonly usagePerRound: number;
  readonly listenTo: ListenTarget;
  readonly handler: EventHandlerAndState;
}

export type EquipmentContext<Writable extends boolean> = EntityContext<EquipmentInfo, EquipmentHandle, "yes", Writable>;

const allEquipments = new Map<number, EquipmentInfo>();
export function registerEquipment(id: number, info: EquipmentInfoNoId) {
  allEquipments.set(id, { ...info, id });
}
export function getEquipment(id: number) {
  if (!allEquipments.has(id)) {
    throw new Error(`Equipment ${id} not found`);
  }
  return allEquipments.get(id)!;
}
