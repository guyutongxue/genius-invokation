import { DamageType } from "@gi-tcg/typings";
import { EntityTag, EntityVariables, ExEntityType } from "../base/entity";
import { TriggeredSkillDefinition } from "../base/skill";
import { Entity } from "./context";
import { registerEntity, registerPassiveSkill } from "./registry";
import {
  BuilderWithShortcut,
  DetailedEventArgOf,
  DetailedEventNames,
  SkillFilter,
  TriggeredSkillBuilder,
  enableShortcut,
} from "./skill";
import { HandleT, PassiveSkillHandle, SkillHandle } from "./type";
import { Draft } from "immer";
import { isReactionSwirl } from "../base/reaction";

export interface VariableOptions {
  recreateAdditional?: number;
  recreateMax?: number;
  /** 该值是否在前端可见，默认为 `true`。仅最后一次添加的变量会显示。 */
  visible?: boolean;
}

// 当 CallerType 是 character 时，正在构建的是被动技能，返回 PassiveSkillHandle
export type EntityBuilderResultT<CallerType extends ExEntityType> =
  CallerType extends "character" ? PassiveSkillHandle : HandleT<CallerType>;

type BuilderMetaOfEntity<
  Event extends DetailedEventNames,
  CallerType extends ExEntityType,
  Vars extends string,
> = {
  callerType: CallerType;
  callerVars: Vars;
  eventArgType: DetailedEventArgOf<Event>;
};

export class EntityBuilder<
  CallerType extends ExEntityType,
  Vars extends string = never,
> {
  private _skillNo = 0;
  _skillList: TriggeredSkillDefinition[] = [];
  _usagePerRoundVarNames: string[] = [];
  private _tags: EntityTag[] = [];
  _constants: Draft<EntityVariables> = {
    duration: Infinity,
    usage: Infinity,
    disposeWhenUsageIsZero: 0,
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
    return this.on("enter", (c) => c.$(`my any with definition id ${id}`))
      .do((c) => {
        // 将位于相同实体区域的目标实体移除
        for (const entity of c.$$(`my any with definition id ${id}`)) {
          if (
            entity.area.type === "characters" &&
            c.self.area.type === "characters"
          ) {
            if (entity.area.characterId === c.self.area.characterId) {
              entity.dispose();
            }
          } else if (entity.area.type === c.self.area.type) {
            entity.dispose();
          }
        }
      })
      .endOn();
  }

  on<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<BuilderMetaOfEntity<E, CallerType, Vars>>,
  ) {
    // BuilderWithShortcut<
    //   TriggeredSkillBuilder<BuilderMetaOfEntity<E, CallerType, Vars>, E>
    // >
    return enableShortcut(
      new TriggeredSkillBuilder<BuilderMetaOfEntity<E, CallerType, Vars>, E>(
        this.generateSkillId(),
        event,
        this,
        filter,
      ),
    );
  }
  once<E extends DetailedEventNames>(
    event: E,
    filter?: SkillFilter<BuilderMetaOfEntity<E, CallerType, Vars>>,
  ) {
    return this.on(event, filter).usage<never>(1, { visible: false });
  }

  variable<const Name extends string>(
    name: Name,
    value: number,
    opt?: VariableOptions,
  ): EntityBuilder<CallerType, Vars | Name> {
    this._constants[name] = value;
    if (typeof opt?.recreateMax === "number") {
      this._constants[name + "$add"] = opt.recreateAdditional ?? value;
      this._constants[name + "$max"] = opt.recreateMax;
    }
    const visible = opt?.visible ?? true;
    if (visible) {
      this._visibleVarName = name;
    }
    return this as any;
  }

  duration(count: number, opt?: VariableOptions) {
    return this.variable("duration", count, opt);
  }
  oneDuration(opt?: VariableOptions) {
    return this.duration(1, { ...opt, visible: false });
  }

  shield(count: number, max?: number) {
    this.tags("shield");
    return this.variable("shield", count, { recreateMax: max })
      .on("beforeDamaged")
      .do((c, e) => {
        const shield = c.getVariable("shield");
        const currentValue = e.value;
        const decreased = Math.min(shield, currentValue);
        e.decreaseDamage(decreased);
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
    TriggeredSkillBuilder<
      BuilderMetaOfEntity<"endPhase", CallerType, Vars | "hintIcon">,
      "endPhase"
    >
  > {
    if (type === "swirledAnemo") {
      return this.hintIcon(DamageType.Anemo)
        .hintText(`${value}`)
        .once(
          "dealDamage",
          (c, e) =>
            ["character", "summon"].includes(e.source.definition.type) &&
            e.isSwirl() !== null,
        )
        .do((c, e) => {
          const swirledType = e.isSwirl()!;
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
        .endOn();
    }
    if (this.type === "character") {
      registerPassiveSkill({
        id: this.id,
        type: "passiveSkill",
        constants: this._constants,
        skills: this._skillList,
      });
    } else {
      registerEntity({
        __definition: "entity",
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
