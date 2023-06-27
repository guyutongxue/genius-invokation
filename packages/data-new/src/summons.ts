
interface SummonInfo {

}

export interface SummonContext {
  readonly entityId: number;
  readonly info: SummonInfo;

  isMine(): boolean;
}

export type SummonInfoWithId = Readonly<SummonInfo & { id: number }>;

const allSummons = new Map<number, SummonInfoWithId>();
export function registerSummons(id: number, info: SummonInfo) {
  allSummons.set(id, {...info, id});
}
export function getSummons(id: number) {
  if (!allSummons.has(id)) {
    throw new Error(`Status ${id} not found`);
  }
  return allSummons.get(id)!;
}
