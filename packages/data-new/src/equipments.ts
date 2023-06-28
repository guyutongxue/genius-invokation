import { EventHandlerCtor } from "./events";

export type EquipmentType = "weapon" | "artifact" | "other";

export interface EquipmentInfo {
  type: EquipmentType;
  // duration: number;
  // usage: number;
  // usagePerRound: number;
  // listenToOthers: boolean;
  handlerCtor: EventHandlerCtor;
}

const allEquipments = new Map<number, EquipmentInfo>();
export function registerEquipment(id: number, info: EquipmentInfo) {
  allEquipments.set(id, info);
}
export function getEquipment(id: number) {
  if (!allEquipments.has(id)) {
    throw new Error(`Equipment ${id} not found`);
  }
  return allEquipments.get(id)!;
}
