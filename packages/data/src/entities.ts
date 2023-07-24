import { CharacterContext } from "./characters";

export type MasterType = "no" | "possible" | "yes";

interface EntityBaseContext<InfoT, HandleT extends number, MasterT extends MasterType, Writable extends boolean = false> {
  readonly entityId: number;
  readonly id: HandleT;
  readonly info: InfoT;

  readonly master: MasterContext<MasterT, Writable>;
  isMine(): boolean;

  readonly usage: number;
  readonly value: number;
}

type MasterContext<MasterT extends MasterType, Writable extends boolean> =
  MasterT extends "no"
  ? never
  : MasterT extends "yes"
  ? CharacterContext<Writable>
  : CharacterContext<Writable> | null;

interface EntityActionContext<InfoT, HandleT extends number, MasterT extends MasterType> extends EntityBaseContext<InfoT, HandleT, MasterT, true> {
  setUsage(value: number): number;
  setValue(value: number): number;
  dispose(): void;
}

export type EntityContext<InfoT, HandleT extends number, MasterT extends MasterType, Writable extends boolean> = Writable extends true
  ? EntityActionContext<InfoT, HandleT, MasterT>
  : EntityBaseContext<InfoT, HandleT, MasterT>;
