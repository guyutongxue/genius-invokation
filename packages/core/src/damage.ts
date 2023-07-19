import { DamageType, Reaction } from "@gi-tcg/typings";
import { Character } from "./character.js";

export class Damage {
  constructor(public sourceId: number, private originalValue: number, private type: DamageType, public target: Character, public triggeredByReaction?: Reaction) {
  }

  changedLogs: [sourceId: number, changedTo: DamageType][] = [];
  addedLogs: [sourceId: number, value: number][] = [];
  multipliedLogs: [sourceId: number, value: number][] = [];
  decreasedLogs: [sourceId: number, value: number][] = [];

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
