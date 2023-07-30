import { DamageType, Reaction } from "@gi-tcg/typings";
import { EntityPath } from "./entity.js";
import { CharacterPath } from "./character.js";

export class Damage {
  constructor(
    public source: EntityPath,
    public target: CharacterPath,
    private originalValue: number,
    private type: DamageType,
    public triggeredByReaction?: Reaction
  ) {}

  changedLogs: [source: EntityPath, changedTo: DamageType][] = [];
  addedLogs: [source: EntityPath, value: number][] = [];
  multipliedLogs: [source: EntityPath, value: number][] = [];
  decreasedLogs: [source: EntityPath, value: number][] = [];

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
