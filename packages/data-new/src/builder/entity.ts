import { GameState } from "..";
import { EntityType } from "../base/entity";
import { EventArg, EventMap, EventNames } from "../base/skill";
import { TriggeredSkillBuilder } from "./skill";
import { HandleT } from "./type";

type EventExt<E extends EventNames> = {
  eventArg: EventArg<E>;
};

export type UnprefixEventName<E> = E extends `on${infer R}` ? Uncapitalize<R> : never;
export type UnUnprefixEventName<E extends string> = `on${Capitalize<E>}`;

export class EntityBuilder<Ext extends object, CallerType extends EntityType> {
  private _skillNo = 0;
  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
  }

  constructor(
    private callerType: CallerType,
    private id: number,
  ) {}

  on<E extends UnprefixEventName<EventNames>>(event: E) {
    type OriginalE = UnUnprefixEventName<E>;
    return new TriggeredSkillBuilder<EventExt<OriginalE>, CallerType>(
      this.callerType,
      this.generateSkillId(),
      this,
    );
  }

  done(): HandleT<CallerType> {
    // TODO
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
