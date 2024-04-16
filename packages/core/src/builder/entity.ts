// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DamageType } from "@gi-tcg/typings";
import {
  EntityTag,
  EntityVariableConfigs,
  ExEntityType,
  USAGE_PER_ROUND_VARIABLE_NAMES,
  VariableConfig,
} from "../base/entity";
import { TriggeredSkillDefinition } from "../base/skill";
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
import { GiTcgDataError } from "../error";
import { createVariable, createVariableCanAppend } from "./utils";
import { Writable } from "../util";

export interface AppendOptions {
  /** 重复创建时的累积值上限 */
  limit?: number;
  /** 重复创建时累积的值 */
  value?: number;
}

export interface VariableOptions {
  /** 该值在重复创建时是否允许叠加。 */
  append?: AppendOptions | boolean;
  /**
   * 该值在重复创建时将强制重置为默认值（而非默认值和当前值的最大值）。
   * 指定 `append` 时此选项无效。
   */
  forceOverwrite?: boolean;
  /** 该值是否在前端可见，默认为 `true`。仅最后一次添加的变量会显示。 */
  visible?: boolean;
}

export type VariableOptionsWithoutAppend = Omit<VariableOptions, "append">;

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

interface GlobalUsageOptions extends VariableOptions {
  /** 是否在 consumeUsage() 且变量到达 0 时时自动弃置实体 */
  autoDispose?: boolean;
}

export class EntityBuilder<
  CallerType extends ExEntityType,
  Vars extends string = never,
> {
  private _skillNo = 0;
  _skillList: TriggeredSkillDefinition[] = [];
  _usagePerRoundIndex = 0;
  private _tags: EntityTag[] = [];
  _varConfigs: Writable<EntityVariableConfigs> = {};
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
    return this.on(event, filter).usage<never>(1, {
      visible: false,
    });
  }

  variable<const Name extends string>(
    name: Name,
    value: number,
    opt?: VariableOptions,
  ): EntityBuilder<CallerType, Vars | Name> {
    if (Reflect.has(this._varConfigs, name)) {
      throw new GiTcgDataError(`Variable name ${name} already exists`);
    }
    let appendOpt: AppendOptions | false;
    if (opt?.append) {
      if (opt.append === true) {
        appendOpt = {};
      } else {
        appendOpt = opt.append;
      }
    } else {
      appendOpt = false;
    }
    let varConfig: VariableConfig;
    if (appendOpt) {
      varConfig = createVariableCanAppend(
        value,
        appendOpt.limit,
        appendOpt.value,
      );
    } else {
      varConfig = createVariable(value, opt?.forceOverwrite);
    }
    this._varConfigs[name] = varConfig;
    const visible = opt?.visible ?? true;
    if (visible) {
      this._visibleVarName = name;
    }
    return this as any;
  }
  variableCanAppend<const Name extends string>(
    name: Name,
    value: number,
    max?: number,
    opt?: VariableOptionsWithoutAppend,
  ): EntityBuilder<CallerType, Vars | Name>;
  variableCanAppend<const Name extends string>(
    name: Name,
    value: number,
    max: number,
    appendValue: number,
    opt?: VariableOptionsWithoutAppend,
  ): EntityBuilder<CallerType, Vars | Name>;
  variableCanAppend(
    name: string,
    value: number,
    max: number,
    appendOrOpt?: number | VariableOptionsWithoutAppend,
    opt?: VariableOptionsWithoutAppend,
  ): any {
    if (typeof appendOrOpt === "number") {
      return this.variable(name, value, {
        append: { limit: max, value: appendOrOpt },
        ...opt,
      });
    } else {
      return this.variable(name, value, {
        append: { limit: max },
        ...appendOrOpt,
      });
    }
  }

  duration(count: number, opt?: VariableOptions) {
    return this.variable("duration", count, opt);
  }
  oneDuration(opt?: VariableOptions) {
    return this.duration(1, { ...opt, visible: false });
  }

  shield(count: number, max?: number) {
    this.tags("shield");
    return this.variableCanAppend("shield", count, max ?? count)
      .on("beforeDamaged", (c, e) => {
        if (c.self.state.definition.type === "combatStatus") {
          // 出战状态护盾只对出战角色生效
          return c.of(e.target).isActive();
        } else {
          return true;
        }
      })
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
    if (this.type !== "status") {
      throw new GiTcgDataError("Only status can have prepare skill");
    }
    if (hintCount) {
      this.variable("preparingSkillHintCount", hintCount);
    }
    return (this as unknown as EntityBuilder<"status", Vars>)
      .on("replaceAction")
      .useSkill(skill)
      .dispose()
      .on("switchActive", (c, e) => e.switchInfo.from.id === c.self.master().id)
      .dispose()
      .endOn();
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
    type: Exclude<DamageType, DamageType.Revive> | "swirledAnemo",
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
        .on(
          "dealDamage",
          (c, e) =>
            ["character", "summon"].includes(e.source.definition.type) &&
            e.isSwirl() !== null,
        )
        .usage(1, { name: "swirledUsage" as never, visible: false })
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

  usage(
    count: number,
    opt: GlobalUsageOptions = {},
  ): EntityBuilder<CallerType, Vars | "usage"> {
    if (opt.autoDispose !== false) {
      this.variable("disposeWhenUsageIsZero", 1);
    }
    return this.variable("usage", count);
  }

  done(): EntityBuilderResultT<CallerType> {
    if (this.type === "status" || this.type === "equipment") {
      this.on("defeated").dispose();
    }
    // on action phase clean up
    if (
      this._usagePerRoundIndex > 0 ||
      Reflect.has(this._varConfigs, "duration")
    ) {
      const usagePerRoundNames = USAGE_PER_ROUND_VARIABLE_NAMES.slice(
        0,
        this._usagePerRoundIndex,
      );
      this.on("actionPhase")
        .do((c, e) => {
          const self = c.self;
          // 恢复每回合使用次数
          for (const prop of usagePerRoundNames) {
            const config = self.state.definition.varConfigs[prop];
            if (config) {
              self.setVariable(prop, config.initialValue);
            }
          }
          // 扣除持续回合数
          self.addVariable("duration", -1);
          if (self.getVariable("duration")! <= 0) {
            self.dispose();
          }
        })
        .endOn();
    }
    if (this.type === "character") {
      registerPassiveSkill({
        id: this.id,
        type: "passiveSkill",
        varConfigs: this._varConfigs,
        skills: this._skillList,
      });
    } else {
      registerEntity({
        __definition: "entities",
        id: this.id,
        visibleVarName: this._visibleVarName,
        varConfigs: this._varConfigs,
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
