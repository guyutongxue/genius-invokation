import { EventHandlerCtor, ListenTarget } from "./events";

export type EquipmentType = "weapon" | "artifact" | "other";

interface EquipmentInfo {
  type: EquipmentType;
  // duration: number;
  // usage: number;
  usagePerRound: number;
  listenTo: ListenTarget;
  handlerCtor: EventHandlerCtor;
}
export type EquipmentInfoWithId = Readonly<EquipmentInfo & { id: number }>;

const allEquipments = new Map<number, EquipmentInfoWithId>();
export function registerEquipment(id: number, info: EquipmentInfo) {
  allEquipments.set(id, { ...info, id });
}
export function getEquipment(id: number) {
  if (!allEquipments.has(id)) {
    throw new Error(`Equipment ${id} not found`);
  }
  return allEquipments.get(id)!;
}
