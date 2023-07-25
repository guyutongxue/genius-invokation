import { DamageContext, EventHandlers, getStatus, StatusInfo } from "@gi-tcg/data";
import { ClonedObj, Entity, shallowClone } from "./entity.js";
import { StatusData } from "@gi-tcg/typings";
import { EventFactory } from "./context.js";

export type PreparingResult =
  | {
      type: "skill";
      id: number;
    }
  | {
      type: "status";
      id: number;
    }
  | null;

export class Status extends Entity {
  public readonly info: StatusInfo;
  private handler: EventHandlers;
  private usagePerRound: number;
  usage: number;
  private duration: number;
  shield: number | null = null;
  shouldDispose = false;

  constructor(id: number) {
    super(id);
    this.info = getStatus(id);
    this.handler = new this.info.handlerCtor();
    this.usage = this.info.usage;
    this.usagePerRound = this.info.usagePerRound;
    this.duration = this.info.duration;
    this.shield =
      typeof this.info.shield === "number"
        ? this.info.shield
        : this.info.shield?.initial ?? null;
  }

  private get prepare() {
    return this.info.prepare?.round ?? null;
  }

  refresh() {
    this.shouldDispose = false;
    this.usage = Math.min(this.usage + this.info.usage, this.info.maxUsage);
    this.usagePerRound = this.info.usagePerRound;
    this.duration = this.info.duration;
    if (this.shield !== null) {
      if (typeof this.info.shield === "number") {
        this.shield = this.info.shield;
      } else if (this.info.shield !== null) {
        this.shield = Math.min(
          this.info.shield.recreateMax,
          this.shield + this.info.shield.initial
        );
      }
    }
  }

  preparing(): PreparingResult {
    if (this.info.prepare === null) return null;
    if (this.info.prepare.round === 1) {
      return { type: "skill", id: this.info.prepare.skillOrStatus };
    } else {
      return { type: "status", id: this.info.prepare.skillOrStatus };
    }
  }

  private getVisibleValueProp() {
    if (this.shield !== null) {
      return "shield" as const;
    }
    if (this.prepare !== null) {
      return "prepare" as const;
    }
    if (this.info.usage !== 1 && isFinite(this.usage)) {
      return "usage" as const;
    }
    if (this.info.duration !== 1 && isFinite(this.duration)) {
      return "duration" as const;
    }
    return null;
  }

  get visibleValue(): number | null {
    const prop = this.getVisibleValueProp();
    if (prop === null) {
      return null;
    } else {
      return this[prop];
    }
  }
  set visibleValue(value: number) {
    const prop = this.getVisibleValueProp();
    if (prop !== null && prop !== "prepare") {
      this[prop] = value;
    }
  }

  protected override onRoundBegin(): void {
    this.usagePerRound = this.info.usagePerRound;
    this.duration--;
    if (this.duration === 0) {
      this.shouldDispose = true;
    }
  }
  protected override doHandleEventSync(handler: EventHandlers<{}>, event: EventFactory): boolean {
    if (this.shield) {
      const candidates = event(this.entityId);
      for (const [name, ctx] of candidates) {
        if (name === "onBeforeDamaged") {
          const c = ctx as DamageContext;
          const decValue = Math.min(this.shield, c.value);
          c.decreaseDamage(decValue);
          this.shield -= decValue;
          if (this.shield === 0) {
            this.shouldDispose = true;
          }
          return true;
        }
      }
    }
    return super.doHandleEventSync(handler, event);
  }

  async handleEvent(event: EventFactory) {
    if (this.shouldDispose || this.usagePerRound === 0) return;
    const result = await this.doHandleEvent(this.handler, event);
    if (result) {
      this.usagePerRound--;
      this.usage--;
      if (this.usage === 0) {
        this.shouldDispose = true;
      }
    }
  }
  handleEventSync(event: EventFactory) {
    if (this.shouldDispose || this.usagePerRound === 0) return;
    const result = this.doHandleEventSync(this.handler, event);
    if (result) {
      if (!Object.hasOwn(this, ClonedObj)) {
        debugger;
      }
      this.usagePerRound--;
      this.usage--;
      if (this.usage === 0) {
        this.shouldDispose = true;
      }
    }
  }

  getData(): StatusData {
    return {
      entityId: this.entityId,
      id: this.id,
      value: this.visibleValue ?? undefined,
    };
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
