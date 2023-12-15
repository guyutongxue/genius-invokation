import { EntityType, EntityTag, EntityVariables } from "../base/entity";
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
import { Draft } from "immer";

export type ExtOfEntity<
  Vars extends string,
  Event extends DetailedEventNames,
> = {
  setVariable<V extends Vars>(prop: V, value: number): void;
  addVariable<V extends Vars>(prop: V, value: number): void;
} & DetailedEventExt<Event>;

export interface VariableOptions {
  recreateMax?: number;
  visible?: boolean;
}

export class EntityBuilder<
  CallerType extends EntityType,
  Vars extends string = never,
> {
  private _skillNo = 0;
  private _skillList: TriggeredSkillDefinition[] = [];
  private _usagePerRoundVarNames: string[] = [];
  private _tags: EntityTag[] = [];
  private _constants: Draft<EntityVariables> = {
    duration: Infinity,
  };
  private _visibleVarName: string | null = null;
  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
  }

  constructor(
    private type: CallerType,
    private id: number,
  ) {}

  on<E extends DetailedEventNames>(event: E) {
    return enableShortcut(
      new TriggeredSkillBuilder<ExtOfEntity<Vars, E>, CallerType, E, Vars>(
        this.type,
        this.generateSkillId(),
        event,
        this,
      ),
    );
  }

  variable<const Name extends string>(
    name: Name,
    value: number,
    opt?: VariableOptions,
  ): EntityBuilder<CallerType, Vars | Name> {
    this._constants[name] = value;
    if (typeof opt?.recreateMax === "number") {
      this._constants[name + "$max"] = opt.recreateMax;
    }
    const visible = opt?.visible ?? true;
    if (visible) {
      this._visibleVarName = name;
    }
    return this;
  }

  duration(count: number): this {
    this.variable("duration", count);
    return this;
  }

  shield(count: number, max?: number) {
    // TODO
    this.tags("shield");
    return this.variable("shield", count, { recreateMax: max });
  }

  tags(...tags: EntityTag[]): this {
    this._tags.push(...tags);
    return this;
  }

  done(): HandleT<CallerType> {
    // on action phase clean up
    this.on("actionPhase")
      .do((c, e) => {
        const self = c.caller();
        for (const prop of this._usagePerRoundVarNames) {
          self.setVariable(prop, 0);
        }
        self.addVariable("duration", -1);
        if (self.state.variables.duration <= 0) {
          self.dispose();
        }
        return false;
      })
      // @ts-expect-error private prop
      .buildSkill();
    registerEntity({
      id: this.id,
      visibleVarName: this._visibleVarName,
      constants: this._constants, // TODO
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

export function equipment(id: number) {
  return new EntityBuilder("equipment", id);
}

export function support(id: number) {
  return new EntityBuilder("support", id);
}
