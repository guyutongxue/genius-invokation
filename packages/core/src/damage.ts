import { DamageType, Reaction } from "@gi-tcg/typings";
import { EntityPath } from "./entity.js";
import { CharacterPath } from "./character.js";

export interface DamageDetail {
  readonly source: EntityPath;
  readonly target: CharacterPath;
  readonly value: number;
  readonly type: DamageType;
  readonly triggeredByReaction: Reaction | null;
  readonly logs: {
    readonly changed: readonly SourceAndChange[],
    readonly added: readonly SourceAndValue[],
    readonly multiplied: readonly SourceAndValue[],
    readonly decreased: readonly SourceAndValue[]
  }
}

type SourceAndChange = readonly [source: EntityPath, changedTo: DamageType];
type SourceAndValue = readonly [source: EntityPath, value: number];

export class Damage {
  constructor(
    public source: EntityPath,
    public target: CharacterPath,
    private originalValue: number,
    private type: DamageType,
    public triggeredByReaction?: Reaction
  ) {}

  changedLogs: SourceAndChange[] = [];
  addedLogs: SourceAndValue[] = [];
  multipliedLogs: SourceAndValue[] = [];
  decreasedLogs: SourceAndValue[] = [];

  getValue() {
    let v = this.originalValue;
    for (const [_, x] of this.addedLogs) {
      v += x;
    }
    for (const [_, x] of this.multipliedLogs) {
      v = Math.ceil(v * x);
    }
    for (const [_, x] of this.decreasedLogs) {
      v -= x;
    }
    return v;
  }

  getType() {
    if (this.changedLogs.length > 0) {
      return this.changedLogs[this.changedLogs.length - 1][1];
    } else {
      return this.type;
    }
  }
}
