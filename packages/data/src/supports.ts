import { SupportHandle } from "./builders";
import { EntityContext } from "./entities";
import { EventHandlerAndState, ListenTarget } from "./events";

export type SupportType = "ally" | "item" | "place" | "other"

type SupportInfoNoId = Omit<SupportInfo, "id">;

export interface SupportInfo {
  readonly id: number;
  readonly type: SupportType;
  readonly duration: number;
  readonly usage: number;
  readonly usagePerRound: number;
  readonly listenTo: Exclude<ListenTarget, "master">;
  readonly handler: EventHandlerAndState;
}

export type SupportContext<Writable extends boolean> = EntityContext<SupportInfo, SupportHandle, "no", Writable>;

const allStatuses = new Map<number, SupportInfo>();
export function registerSupport(id: number, info: SupportInfoNoId) {
  allStatuses.set(id, { ...info, id });
}
export function getSupport(id: number) {
  if (!allStatuses.has(id)) {
    throw new Error(`Support ${id} not found`);
  }
  return allStatuses.get(id)!;
}
