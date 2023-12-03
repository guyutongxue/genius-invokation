import { EntityType, EntityTag } from "../base/entity";
import {
  EventExt,
  EventMap,
  EventNames,
  TriggeredSkillDefinition,
} from "../base/skill";
import { registerEntity } from "./registry";
import {
  DetailedEventExt,
  DetailedEventNames,
  TriggeredSkillBuilder,
  enableShortcut,
} from "./skill";
import { HandleT } from "./type";

export class EntityBuilder<Ext extends object, CallerType extends EntityType> {
  private _skillNo = 0;
  private _skillList: TriggeredSkillDefinition[] = [];
  private _tags: EntityTag[] = [];
  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
  }

  constructor(
    private type: CallerType,
    private id: number,
  ) {}

  on<E extends DetailedEventNames>(event: E) {
    return enableShortcut(new TriggeredSkillBuilder<DetailedEventExt<E>, CallerType, E>(
      this.type,
      this.generateSkillId(),
      event,
      this,
    ));
  }

  duration(count: number): this {
    // TODO
    return this;
  }

  usage(count: number, max?: number): this {
    // TODO
    return this;
  }

  shield(count: number, max?: number): this {
    // TODO
    this.tags("shield");
    return this;
  }

  tags(...tags: EntityTag[]): this {
    this._tags.push(...tags);
    return this;
  }

  done(): HandleT<CallerType> {
    registerEntity({
      id: this.id,
      constants: {
        duration: Infinity,
      }, // TODO
      skills: this._skillList,
      tags: this._tags,
      type: this.type,
    });
    return this.id as HandleT<CallerType>;
  }
}

export function summon(id: number) {
  return new EntityBuilder("summon", id);
}

export function status(id: number) {
  return new EntityBuilder("status", id);
}

export function combatStatus(id: number) {
  return new EntityBuilder("combatStatus", id);
}
