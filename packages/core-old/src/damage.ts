import { Aura, DamageData, DamageType, Reaction } from "@gi-tcg/typings";
import { EntityPath } from "./entity.js";
import { CharacterPath } from "./character.js";

export interface DamageLogType {
  readonly source: EntityPath;
  readonly target: CharacterPath;
  readonly value: number;
  readonly type: DamageType;
  readonly targetAura: Aura;
  readonly triggeredByReaction: Reaction | null;
}

type SourceAndChange = readonly [source: EntityPath, changedTo: DamageType];
type SourceAndValue = readonly [source: EntityPath, value: number];

export class Damage {
  constructor(
    public readonly source: EntityPath,
    public readonly target: CharacterPath,
    private readonly originalValue: number,
    private readonly type: DamageType,
    public readonly targetAura: Aura,
    public triggeredByReaction: Reaction | null = null
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

  toData(): DamageData {
    return {
      target: this.target.entityId,
      type: this.getType(),
      value: this.getValue(),
      log: [
        {
          source: this.source.info.id,
          what: `Original damage ${this.originalValue} with type ${this.type}`,
        },
        ...this.changedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `Change damage type to ${c}`,
        })),
        ...this.addedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `+${c}`,
        })),
        ...this.multipliedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `*${c}`,
        })),
        ...this.decreasedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `-${c}`,
        })),
      ],
    };
  }

  toLogType(): DamageLogType {
    return {
      source: this.source,
      target: this.target,
      triggeredByReaction: this.triggeredByReaction ?? null,
      type: this.getType(),
      targetAura: this.targetAura,
      value: this.getValue(),
    };
  }
}
