import { DamageType } from "@gi-tcg/typings";
import { EntityTag, EntityVariables, ExEntityType } from "../base/entity";
import { TriggeredSkillDefinition } from "../base/skill";
import { EntityContext } from "./context";
import { registerEntity, registerPassiveSkill } from "./registry";
import {
  BuilderWithShortcut,
  DetailedEventExt,
  DetailedEventNames,
  SkillFilter,
  TriggeredSkillBuilder,
  enableShortcut,
} from "./skill";
import { HandleT, PassiveSkillHandle, SkillHandle } from "./type";
import { Draft } from "immer";
import { isReactionSwirl } from "./reaction";

export type ExtOfEntity<
  Vars extends string,
  Event extends DetailedEventNames,
> = {
  setVariable<V extends Vars>(prop: V, value: number): void;
  addVariable<V extends Vars>(prop: V, value: number): void;
} & DetailedEventExt<Event>;

export interface VariableOptions {
  recreateMax?: number;
  /** 该值是否在前端可见，默认为 `true`。仅最后一次添加的变量会显示。 */
  visible?: boolean;
}

// 当 CallerType 是 character 时，正在构建的是被动技能，返回 PassiveSkillHandle
export type EntityBuilderResultT<CallerType extends ExEntityType> =
  CallerType extends "character" ? PassiveSkillHandle : HandleT<CallerType>;

export class EntityBuilder<
  CallerType extends ExEntityType,
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
  private _hintText: string | null = null;
  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
  }

  constructor(
    private type: CallerType,
    private id: number,
  ) {}

  conflictWith(id: number) {
    this.on("enter").do((c) => {
      const ctx = c.$(`my any with definition id ${id}`);
      if (ctx && ctx instanceof EntityContext) {
        ctx.dispose();
      }
    });
    return this;
  }

  on<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<ExtOfEntity<Vars, E>, CallerType>,
  ): BuilderWithShortcut<
    ExtOfEntity<Vars, E>,
    CallerType,
    TriggeredSkillBuilder<ExtOfEntity<Vars, E>, CallerType, E, Vars>
  > {
    return enableShortcut(
      new TriggeredSkillBuilder<ExtOfEntity<Vars, E>, CallerType, E, Vars>(
        this.generateSkillId(),
        event,
        this,
        filter,
      ),
    );
  }
  once<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<ExtOfEntity<Vars, E>, CallerType>,
  ) {
    return this.on(event, filter).usage(1, { visible: false });
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

  duration(count: number, opt?: VariableOptions): this {
    this.variable("duration", count, opt);
    return this;
  }
  oneDuration(opt?: VariableOptions): this {
    return this.duration(1, { ...opt, visible: false });
  }

  shield(count: number, max?: number) {
    this.tags("shield");
    return this.variable("shield", count, { recreateMax: max })
      .on("beforeDamaged")
      .do((c) => {
        const shield = c.getVariable("shield");
        const currentValue = c.damageInfo.value;
        const decreased = Math.min(shield, currentValue);
        c.decreaseDamage(decreased);
        c.addVariable("shield", -decreased);
        if (shield <= currentValue) {
          c.dispose();
        }
      })
      .endOn();
  }

  prepare(skill: SkillHandle, hintCount?: number) {
    if (hintCount) {
      this.variable("preparingSkillHintCount", hintCount);
    }
    return this.on("replaceAction").useSkill(skill).dispose().endOn();
  }

  tags(...tags: EntityTag[]): this {
    this._tags.push(...tags);
    return this;
  }

  hintText(text: string): this {
    this._hintText = text;
    return this;
  }
  hintIcon(damageType: DamageType) {
    return this.variable("hintIcon", damageType);
  }

  /**
   * Same as
   * ```
   *   .hintIcon(type)
   *   .hintText(`${value}`)
   *   .on("endPhase")
   *   .damage(type, value[, target])
   * ```
   *
   * Note: use `DamageType.Heal` as equivalent of `.heal`
   * @param type
   * @param value
   * @returns
   */
  endPhaseDamage(
    type: DamageType | "swirledAnemo",
    value: number,
    target?: string,
  ): BuilderWithShortcut<
    ExtOfEntity<Vars | "hintIcon", "endPhase">,
    CallerType,
    TriggeredSkillBuilder<
      ExtOfEntity<Vars | "hintIcon", "endPhase">,
      CallerType,
      "endPhase",
      Vars | "hintIcon"
    >
  > {
    if (type === "swirledAnemo") {
      return this.hintIcon(DamageType.Anemo)
        .hintText(`${value}`)
        .once("dealDamage", (c) => isReactionSwirl(c.eventArg) !== null)
        .do((c) => {
          const swirledType = isReactionSwirl(c.eventArg)!;
          c.setVariable("hintIcon", swirledType);
        })
        .on("endPhase")
        .do((c) => {
          c.damage(c.self.state.variables.hintIcon, value, target);
        });
    } else {
      return this.hintIcon(type)
        .hintText(`${value}`)
        .on("endPhase")
        .damage(type, value, target);
    }
  }

  done(): EntityBuilderResultT<CallerType> {
    // on action phase clean up
    if (
      this._usagePerRoundVarNames.length > 0 ||
      isFinite(this._constants.duration)
    ) {
      this.on("actionPhase")
        .do((c, e) => {
          const self = c.self;
          // 恢复每回合使用次数
          for (const prop of this._usagePerRoundVarNames) {
            const newValue = self.state.definition.constants[prop];
            self.setVariable(prop, newValue);
          }
          // 扣除持续回合数
          self.addVariable("duration", -1);
          if (self.getVariable("duration") <= 0) {
            self.dispose();
          }
        })
        // @ts-expect-error private prop
        .buildSkill();
    }
    if (this.type === "character") {
      registerPassiveSkill({
        id: this.id,
        type: "passiveSkill",
        skills: this._skillList,
      });
    } else {
      registerEntity({
        id: this.id,
        visibleVarName: this._visibleVarName,
        constants: this._constants,
        hintText: this._hintText,
        skills: this._skillList,
        tags: this._tags,
        type: this.type,
      });
    }
    return this.id as EntityBuilderResultT<CallerType>;
  }

  /** 此定义未被使用。 */
  reserve(): void {}
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
