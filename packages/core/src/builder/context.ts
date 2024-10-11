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

import {
  Aura,
  DamageType,
  DiceType,
  ExposedMutation,
  Reaction,
} from "@gi-tcg/typings";

import {
  EntityArea,
  EntityDefinition,
  EntityTag,
  EntityType,
  ExEntityType,
  USAGE_PER_ROUND_VARIABLE_NAMES,
  stringifyEntityArea,
} from "../base/entity";
import { CreateCardM, Mutation, TransferCardM } from "../base/mutation";
import {
  DamageInfo,
  DisposeOrTuneMethod,
  EventAndRequest,
  EventAndRequestConstructorArgs,
  EventAndRequestNames,
  EventArgOf,
  GenericModifyDamageEventArg,
  HealInfo,
  HealKind,
  InlineEventNames,
  ModifyHealEventArg,
  ReactionInfo,
  SkillDescription,
  SkillInfo,
  SkillInfoOfContextConstruction,
  constructEventAndRequestArg,
} from "../base/skill";
import {
  AnyState,
  CardState,
  CharacterState,
  CharacterVariables,
  EntityState,
  EntityVariables,
  GameState,
  stringifyState,
} from "../base/state";
import {
  allEntitiesAtArea,
  allSkills,
  diceCostOfCard,
  elementOfCharacter,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  nationOfCharacter,
  sortDice,
  weaponOfCharacter,
} from "../utils";
import { executeQuery } from "../query";
import {
  AppliableDamageType,
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  ExEntityState,
  ExtensionHandle,
  HandleT,
  SkillHandle,
  StatusHandle,
  SummonHandle,
  TypedExEntity,
} from "./type";
import { CardDefinition, CardTag } from "../base/card";
import { GuessedTypeOfQuery } from "../query/types";
import { NontrivialDamageType, REACTION_MAP } from "../base/reaction";
import {
  CALLED_FROM_REACTION,
  ReactionDescriptionEventArg,
  getReactionDescription,
} from "./reaction";
import { flip } from "@gi-tcg/utils";
import { GiTcgCoreInternalError, GiTcgDataError } from "../error";
import { DetailLogType } from "../log";
import {
  CreateEntityOptions,
  GiTcgPreviewAbortedError,
  InternalNotifyOption,
  InternalPauseOption,
  MutatorConfig,
  StateMutator,
} from "../mutator";
import { CharacterDefinition, NationTag, WeaponTag } from "../base/character";
import { Draft, produce } from "immer";
import { nextRandom } from "../random";

type CharacterTargetArg = CharacterState | CharacterState[] | string;
type EntityTargetArg = EntityState | EntityState[] | string;

interface DrawCardsOpt {
  who?: "my" | "opp";
  /** 抽取带有特定标签的牌 */
  withTag?: CardTag | null;
  /** 抽取选定定义的牌。设置此选项会忽略 withTag */
  withDefinition?: CardHandle | null;
}

interface HealOption {
  kind?: HealKind;
}

type InsertPilePayload =
  | Omit<CreateCardM, "targetIndex" | "who">
  | Omit<TransferCardM, "targetIndex" | "who">;

type InsertPileStrategy =
  | "top"
  | "bottom"
  | "random"
  | "spaceAround"
  | `topRange${number}`
  | `topIndex${number}`;

type Setter<T> = (draft: Draft<T>) => void;

export type ContextMetaBase = {
  readonly: boolean;
  eventArgType: unknown;
  callerVars: string;
  callerType: ExEntityType;
  associatedExtension: ExtensionHandle;
};

/**
 * 用于描述技能的上下文对象。
 * 它们出现在 `.do()` 形式内，将其作为参数传入。
 */
export class SkillContext<Meta extends ContextMetaBase> {
  public readonly skillInfo: Required<SkillInfoOfContextConstruction>;
  private readonly mutator: StateMutator;
  private readonly eventAndRequests: EventAndRequest[] = [];
  private readonly originalOnNotify?: (opt: InternalNotifyOption) => void;
  public readonly callerArea: EntityArea;

  /**
   * 获取正在执行逻辑的实体的 `CharacterContext` 或 `EntityContext`。
   * @returns
   */
  public readonly self: TypedExEntity<Meta, Meta["callerType"]>;

  /**
   *
   * @param state 触发此技能之前的游戏状态
   * @param skillInfo
   */
  constructor(
    state: GameState,
    skillInfo: SkillInfoOfContextConstruction,
    public readonly eventArg: Meta["eventArgType"] extends object
      ? Omit<Meta["eventArgType"], `_${string}`>
      : Meta["eventArgType"],
  ) {
    this.originalOnNotify = skillInfo.mutatorConfig?.onNotify;
    const mutatorConfig: MutatorConfig = {
      ...skillInfo.mutatorConfig,
      onNotify: (opt) => this.onNotify(opt),
      onPause: async () => {},
    };
    this.skillInfo = {
      ...skillInfo,
      mutatorConfig,
    }
    this.mutator = new StateMutator(state, mutatorConfig);
    this.callerArea = getEntityArea(state, this.skillInfo.caller.id);
    this.self = this.of(this.skillInfo.caller);
  }
  /**
   * 技能执行完毕，发出通知，禁止后续改动。
   * @internal
   */
  _terminate() {
    this.mutator.notify();
    this.originalOnNotify?.({
      canResume: false,
      state: this.state,
      stateMutations: this._stateMutations,
      exposedMutations: this._exposedMutations,
    });
    Object.freeze(this);
  }
  private _stateMutations: Mutation[] = [];
  private _exposedMutations: ExposedMutation[] = [];

  // 将技能中引发的通知保存下来，最后调用 _terminate 时再整体通知
  private onNotify(opt: InternalNotifyOption): void {
    this._stateMutations.push(...opt.stateMutations);
    this._exposedMutations.push(...opt.exposedMutations);
  }

  mutate(mut: Mutation) {
    return this.mutator.mutate(mut);
  }

  get isPreview(): boolean {
    return !!this.skillInfo.isPreview;
  }

  get state() {
    return this.mutator.state;
  }

  get player() {
    return this.state.players[this.callerArea.who];
  }
  get oppPlayer() {
    return this.state.players[flip(this.callerArea.who)];
  }
  private get callerState(): CharacterState | EntityState {
    return getEntityById(this.state, this.skillInfo.caller.id, true);
  }
  isMyTurn() {
    return this.state.currentTurn === this.callerArea.who;
  }

  private handleInlineEvent<E extends InlineEventNames>(
    event: E,
    arg: EventArgOf<E>,
  ) {
    using l = this.mutator.subLog(
      DetailLogType.Event,
      `Handling inline event ${event} (${arg.toString()}):`,
    );
    const infos = allSkills(this.state, event).map<SkillInfo>(
      ({ caller, skill }) => ({
        caller,
        definition: skill,
        fromCard: null,
        requestBy: null,
        charged: false,
        plunging: false,
        isPreview: this.skillInfo.isPreview,
        mutatorConfig: this.skillInfo.mutatorConfig,
      }),
    );
    for (const info of infos) {
      arg._currentSkillInfo = info;
      try {
        getEntityById(this.state, info.caller.id, true);
      } catch {
        continue;
      }
      if (
        "filter" in info.definition &&
        !(0, info.definition.filter)(this.state, info, arg as any)
      ) {
        continue;
      }
      using l = this.mutator.subLog(
        DetailLogType.Skill,
        `Using skill [skill:${info.definition.id}]`,
      );
      const desc = info.definition.action as SkillDescription<EventArgOf<E>>;
      const [newState, newEvents] = desc(this.state, info, arg);
      this.mutator.notify();
      this.mutator.resetState(newState);
      this.eventAndRequests.push(...newEvents);
    }
  }

  $<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>> | undefined {
    const result = this.$$(arg);
    return result[0];
  }

  $$<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>>[] {
    return executeQuery(this, arg);
  }

  // Get context of given entity state
  of(entityState: EntityState): Entity<Meta>;
  of(entityState: CharacterState): Character<Meta>;
  of<T extends ExEntityType = ExEntityType>(
    entityId: EntityState | CharacterState | number,
  ): TypedExEntity<Meta, T>;
  of(entityState: EntityState | CharacterState | number): unknown {
    if (typeof entityState === "number") {
      entityState = getEntityById(this.state, entityState, true);
    }
    if (entityState.definition.type === "character") {
      return new Character(this, entityState.id);
    } else {
      return new Entity(this, entityState.id);
    }
  }

  private queryOrOf<TypeT extends ExEntityType>(
    q: AnyState | AnyState[] | string,
  ): TypedExEntity<Meta, TypeT>[] {
    if (Array.isArray(q)) {
      return q.map((s) => this.of(s));
    } else if (typeof q === "string") {
      return this.$$(q) as TypedExEntity<Meta, TypeT>[];
    } else {
      return [this.of(q)];
    }
  }

  private queryCoerceToCharacters(
    arg: CharacterTargetArg,
  ): TypedCharacter<Meta>[] {
    const result = this.queryOrOf(arg);
    for (const r of result) {
      if (r instanceof Character) {
        continue;
      } else {
        throw new GiTcgDataError(
          `Expected character target, but query ${arg} found noncharacter entities`,
        );
      }
    }
    return result as TypedCharacter<Meta>[];
  }

  getExtensionState(): Meta["associatedExtension"]["type"] {
    if (typeof this.skillInfo.associatedExtensionId === "undefined") {
      throw new GiTcgDataError("No associated extension registered");
    }
    const ext = this.state.extensions.find(
      (ext) => ext.definition.id === this.skillInfo.associatedExtensionId,
    );
    if (!ext) {
      throw new GiTcgDataError("Associated extension not found");
    }
    return ext.state;
  }
  /** 本回合已使用多少次本技能（仅限角色主动技能）。 */
  countOfSkill(): number;
  /**
   * 本回合我方 `characterId` 角色已使用了多少次技能 `skillId`。
   *
   * `characterId` 是定义 id 而非实体 id。
   */
  countOfSkill(characterId: CharacterHandle, skillId: SkillHandle): number;
  countOfSkill(characterId?: number, skillId?: number): number {
    characterId ??= this.callerState.definition.id;
    skillId ??= this.skillInfo.definition.id;
    return (
      this.player.roundSkillLog.get(characterId)?.filter((e) => e === skillId)
        .length ?? 0
    );
  }
  /** 我方或对方原本元素骰费用最多的手牌列表 */
  getMaxCostHands(who: "my" | "opp" = "my"): CardState[] {
    const player = who === "my" ? this.player : this.oppPlayer;
    const maxCost = Math.max(
      ...player.hands.map((c) => diceCostOfCard(c.definition)),
    );
    return player.hands.filter((c) => diceCostOfCard(c.definition) === maxCost);
  }

  // MUTATIONS

  get events() {
    return this.eventAndRequests;
  }

  emitEvent<E extends EventAndRequestNames>(
    event: E,
    ...args: EventAndRequestConstructorArgs<E>
  ) {
    const arg = constructEventAndRequestArg(event, ...args);
    this.mutator.log(DetailLogType.Other, `Event ${event} (${arg.toString()}) emitted`);
    this.eventAndRequests.push([event, arg] as EventAndRequest);
  }

  abortPreview() {
    if (this.isPreview) {
      throw new GiTcgPreviewAbortedError();
    }
  }

  switchActive(target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    if (targets.length !== 1) {
      throw new GiTcgDataError(
        "Expected exactly one target when switching active",
      );
    }
    const switchToTarget = targets[0];
    const playerWho = switchToTarget.who;
    const from =
      this.state.players[playerWho].characters[
        getActiveCharacterIndex(this.state.players[playerWho])
      ];
    if (from.id === switchToTarget.id) {
      return;
    }
    let immuneControlStatus: EntityState | undefined;
    if (
      (immuneControlStatus = from.entities.find((st) =>
        st.definition.tags.includes("immuneControl"),
      ))
    ) {
      this.mutator.log(
        DetailLogType.Other,
        `Switch active from ${stringifyState(from)} to ${stringifyState(
          switchToTarget.state,
        )}, but ${stringifyState(immuneControlStatus)} disabled this!`,
      );
      return;
    }
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Switch active from ${stringifyState(from)} to ${stringifyState(
        switchToTarget.state,
      )}`,
    );
    this.mutate({
      type: "switchActive",
      who: playerWho,
      value: switchToTarget.state,
    });
    this.mutator.notify({
      mutations: [
        {
          type: "switchActive",
          who: playerWho,
          id: switchToTarget.id,
          definitionId: switchToTarget.definition.id,
          via: this.fromReaction
            ? Reaction.Overloaded
            : this.skillInfo.definition.id ?? null,
        },
      ],
    });
    this.emitEvent("onSwitchActive", this.state, {
      type: "switchActive",
      who: playerWho,
      from: from,
      via: this.skillInfo,
      fromReaction: this.fromReaction !== null,
      to: switchToTarget.state,
    });
  }

  gainEnergy(value: number, target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Gain ${value} energy to ${stringifyState(t.state)}`,
      );
      const targetState = t.state;
      const finalValue = Math.min(
        value,
        targetState.variables.maxEnergy - targetState.variables.energy,
      );
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "energy",
        value: targetState.variables.energy + finalValue,
      });
    }
  }

  /** 治疗角色 */
  heal(
    value: number,
    target: CharacterTargetArg,
    { kind = "common" }: HealOption = {},
  ) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const damageType = DamageType.Heal;
      const targetState = t.state;
      if (!targetState.variables.alive) {
        if (kind === "revive") {
          this.mutator.log(
            DetailLogType.Other,
            `Before healing ${stringifyState(targetState)}, revive him.`,
          );
          this.mutate({
            type: "modifyEntityVar",
            state: targetState,
            varName: "alive",
            value: 1,
          });
          this.emitEvent("onRevive", this.state, targetState);
        } else {
          continue;
        }
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Heal ${value} to ${stringifyState(targetState)}`,
      );
      const targetInjury =
        targetState.variables.maxHealth - targetState.variables.health;
      const finalValue = Math.min(value, targetInjury);
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "health",
        value: targetState.variables.health + finalValue,
      });
      let healInfo: HealInfo = {
        type: damageType,
        expectedValue: value,
        value: finalValue,
        healKind: kind,
        source: this.callerState,
        via: this.skillInfo,
        target: targetState,
        causeDefeated: false,
        fromReaction: null,
      };
      const modifier = new ModifyHealEventArg(this.state, healInfo);
      this.handleInlineEvent("modifyHeal", modifier);
      healInfo = modifier.damageInfo;
      this.mutator.notify({
        mutations: [
          {
            type: "damage",
            damage: {
              type: healInfo.type,
              value: healInfo.value,
              target: targetState.id,
            },
          },
        ],
      });
      // this.mutate({
      //   type: "pushDamageLog",
      //   damage: healInfo,
      // });
      this.emitEvent("onDamageOrHeal", this.state, healInfo);
    }
  }

  damage(
    type: DamageType,
    value: number,
    target: CharacterTargetArg = "opp active",
  ) {
    if (type === DamageType.Heal) {
      return this.heal(value, target);
    }
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Deal ${value} [damage:${type}] damage to ${stringifyState(t.state)}`,
      );
      const targetState = t.state;
      let damageInfo: DamageInfo = {
        source: this.skillInfo.caller,
        target: targetState,
        type,
        value,
        via: this.skillInfo,
        causeDefeated:
          !!targetState.variables.alive &&
          targetState.variables.health <= value,
        fromReaction: this.fromReaction,
      };
      if (damageInfo.type !== DamageType.Piercing) {
        const modifier = new GenericModifyDamageEventArg(
          this.state,
          damageInfo,
        );
        this.handleInlineEvent("modifyDamage0", modifier);
        modifier.increaseDamageByReaction();
        this.handleInlineEvent("modifyDamage1", modifier);
        this.handleInlineEvent("modifyDamage2", modifier);
        this.handleInlineEvent("modifyDamage3", modifier);
        damageInfo = modifier.damageInfo;
      }
      this.mutator.log(
        DetailLogType.Other,
        `Damage info: ${damageInfo.log || "(no modification)"}`,
      );
      const finalHealth = Math.max(
        0,
        targetState.variables.health - damageInfo.value,
      );
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "health",
        value: finalHealth,
      });
      if (damageInfo.target.variables.alive) {
        this.mutator.notify({
          mutations: [
            {
              type: "damage",
              damage: {
                type: damageInfo.type,
                value: damageInfo.value,
                target: damageInfo.target.id,
              },
            },
          ],
        });
      }
      this.emitEvent("onDamageOrHeal", this.state, damageInfo);
      if (
        damageInfo.type !== DamageType.Physical &&
        damageInfo.type !== DamageType.Piercing
      ) {
        this.doApply(t, damageInfo.type, damageInfo);
      }
    }
  }

  /**
   * 为某角色附着元素。
   * @param type 附着的元素类型
   * @param target 角色目标
   */
  apply(type: AppliableDamageType, target: CharacterTargetArg) {
    const characters = this.queryCoerceToCharacters(target);
    for (const ch of characters) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Apply [damage:${type}] to ${stringifyState(ch.state)}`,
      );
      this.doApply(ch, type);
    }
  }

  private get fromReaction(): Reaction | null {
    return (this as any)[CALLED_FROM_REACTION] ?? null;
  }

  private doApply(
    target: TypedCharacter<Meta>,
    type: NontrivialDamageType,
    fromDamage?: DamageInfo,
  ) {
    if (!target.state.variables.alive) {
      return;
    }
    const aura = target.state.variables.aura;
    const [newAura, reaction] = REACTION_MAP[aura][type];
    this.mutate({
      type: "modifyEntityVar",
      state: target.state,
      varName: "aura",
      value: newAura,
    });
    if (reaction !== null) {
      this.mutator.log(
        DetailLogType.Other,
        `Apply reaction ${reaction} to ${stringifyState(target.state)}`,
      );
      const reactionInfo: ReactionInfo = {
        target: target.state,
        type: reaction,
        via: this.skillInfo,
        fromDamage,
      };
      this.mutator.notify({
        mutations: [
          {
            type: "elementalReaction",
            on: target.state.id,
            reactionType: reaction,
          },
        ],
      });
      this.emitEvent("onReaction", this.state, reactionInfo);
      const reactionDescriptionEventArg: ReactionDescriptionEventArg = {
        where: target.who === this.callerArea.who ? "my" : "opp",
        here: target.who === this.callerArea.who ? "opp" : "my",
        id: target.state.id,
        isDamage: !!fromDamage,
        isActive: target.isActive(),
      };
      const reactionDescription = getReactionDescription(reaction);
      if (reactionDescription) {
        const [newState, events] = reactionDescription(
          this.state,
          this.skillInfo,
          reactionDescriptionEventArg,
        );
        this.eventAndRequests.push(...events);
        this.mutator.resetState(newState);
      }
    }
  }

  createEntity<TypeT extends EntityType>(
    type: TypeT,
    id: HandleT<TypeT>,
    area?: EntityArea,
    opt: CreateEntityOptions = {},
  ): Entity<Meta> | null {
    const id2 = id as number;
    const def = this.state.data.entities.get(id2);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown entity definition id ${id2}`);
    }
    if (typeof area === "undefined") {
      switch (type) {
        case "combatStatus":
          area = {
            type: "combatStatuses",
            who: this.callerArea.who,
          };
          break;
        case "summon":
          area = {
            type: "summons",
            who: this.callerArea.who,
          };
          break;
        case "support":
          area = {
            type: "supports",
            who: this.callerArea.who,
          };
          break;
        default:
          throw new GiTcgDataError(
            `Creating entity of type ${type} requires explicit area`,
          );
      }
    }
    const { oldState, newState } = this.mutator.createEntity(def, area, opt);
    if (newState) {
      this.emitEvent("onEnter", this.state, {
        overridden: oldState,
        newState,
      });
      return this.of(newState);
    } else {
      return null;
    }
  }
  summon(
    id: SummonHandle,
    where: "my" | "opp" = "my",
    opt: CreateEntityOptions = {},
  ) {
    if (where === "my") {
      this.createEntity("summon", id, void 0, opt);
    } else {
      this.createEntity(
        "summon",
        id,
        {
          type: "summons",
          who: flip(this.callerArea.who),
        },
        opt,
      );
    }
  }
  characterStatus(
    id: StatusHandle,
    target: CharacterTargetArg = "@self",
    opt: CreateEntityOptions = {},
  ) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      this.createEntity("status", id, t.area, opt);
    }
  }
  combatStatus(
    id: CombatStatusHandle,
    where: "my" | "opp" = "my",
    opt: CreateEntityOptions = {},
  ) {
    if (where === "my") {
      this.createEntity("combatStatus", id, void 0, opt);
    } else {
      this.createEntity(
        "combatStatus",
        id,
        {
          type: "combatStatuses",
          who: flip(this.callerArea.who),
        },
        opt,
      );
    }
  }

  transferEntity(target: EntityTargetArg, area: EntityArea) {
    const targets = this.queryOrOf(target);
    for (const target of targets) {
      if (target.state.definition.type === "character") {
        throw new GiTcgDataError(`Cannot transfer a character`);
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Transfer ${stringifyState(target.state)} to ${stringifyEntityArea(
          area,
        )}`,
      );
      const state = target.state as EntityState;
      this.mutate({
        type: "removeEntity",
        oldState: state,
      });
      const newState = { ...state };
      this.mutate({
        type: "createEntity",
        value: newState,
        where: area,
      });
    }
  }

  dispose(target: EntityTargetArg = "@self") {
    const targets = this.queryOrOf(target);
    for (const t of targets) {
      const who = t.who;
      const entityState = t.state;
      if (entityState.definition.type === "character") {
        throw new GiTcgDataError(
          `Character caller cannot be disposed. You may forget an argument when calling \`dispose\``,
        );
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Dispose ${stringifyState(entityState)}`,
      );
      this.emitEvent("onDispose", this.state, entityState);
      this.mutate({
        type: "removeEntity",
        oldState: entityState,
      });
    }
  }

  // NOTICE: getVariable/setVariable/addVariable 应当将 caller 的严格版声明放在最后一个
  // 因为 (...args: infer R) 只能获取到重载列表中的最后一个，而严格版是 BuilderWithShortcut 需要的

  getVariable(prop: string, target: CharacterState | EntityState): number;
  getVariable(prop: Meta["callerVars"]): number;
  getVariable(prop: string, target?: CharacterState | EntityState) {
    if (target) {
      return this.of(target).getVariable(prop);
    } else {
      return this.self.getVariable(prop);
    }
  }

  setVariable(
    prop: string,
    value: number,
    target: CharacterState | EntityState,
  ): void;
  setVariable(prop: Meta["callerVars"], value: number): void;
  setVariable(prop: any, value: number, target?: CharacterState | EntityState) {
    target ??= this.callerState;
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Set ${stringifyState(target)}'s variable ${prop} to ${value}`,
    );
    this.mutate({
      type: "modifyEntityVar",
      state: target,
      varName: prop,
      value: value,
    });
  }

  addVariable(
    prop: string,
    value: number,
    target: CharacterState | EntityState,
  ): void;
  addVariable(prop: Meta["callerVars"], value: number): void;
  addVariable(prop: any, value: number, target?: CharacterState | EntityState) {
    target ??= this.callerState;
    const finalValue = value + target.variables[prop];
    this.setVariable(prop, finalValue, target);
  }

  addVariableWithMax(
    prop: string,
    value: number,
    maxLimit: number,
    target: CharacterState | EntityState,
  ): void;
  addVariableWithMax(
    prop: Meta["callerVars"],
    value: number,
    maxLimit: number,
  ): void;
  addVariableWithMax(
    prop: any,
    value: number,
    maxLimit: number,
    target?: CharacterState | EntityState,
  ) {
    target ??= this.callerState;
    const finalValue = Math.min(maxLimit, value + target.variables[prop]);
    this.setVariable(prop, finalValue, target);
  }
  consumeUsage(count = 1, target?: EntityState) {
    if (typeof target === "undefined") {
      if (this.callerState.definition.type === "character") {
        throw new GiTcgDataError(`Cannot consume usage of character`);
      }
      target = this.callerState as EntityState;
    }
    if (!Reflect.has(target.definition.varConfigs, "usage")) {
      return;
    }
    const current = this.getVariable("usage", target);
    if (current > 0) {
      this.addVariable("usage", -Math.min(count, current), target);
      if (
        Reflect.has(target.definition.varConfigs, "disposeWhenUsageIsZero") &&
        this.getVariable("usage", target) <= 0
      ) {
        this.dispose(target);
      }
    }
  }
  consumeUsagePerRound(count = 1) {
    if (!("usagePerRoundVariableName" in this.skillInfo.definition)) {
      throw new GiTcgDataError(`This skill do not have usagePerRound`);
    }
    const varName = this.skillInfo.definition.usagePerRoundVariableName;
    if (varName === null) {
      throw new GiTcgDataError(`This skill do not have usagePerRound`);
    }
    const current = this.getVariable(varName, this.callerState);
    if (current > 0) {
      this.addVariable(varName, -Math.min(count, current), this.callerState);
    }
  }

  transformDefinition<DefT extends ExEntityType>(
    target: ExEntityState<DefT>,
    newDefId: HandleT<DefT>,
  ): void;
  transformDefinition(target: string, newDefId: number): void;
  transformDefinition(
    target: string | EntityState | CharacterState,
    newDefId: number,
  ) {
    if (typeof target === "string") {
      const entity = this.$(target);
      if (entity) {
        target = entity.state;
      } else {
        throw new GiTcgDataError(
          `Query ${target} doesn't find 1 character or entity`,
        );
      }
    }
    const oldDef = target.definition;
    const def = this.state.data[oldDef.__definition].get(newDefId);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown definition id ${newDefId}`);
    }
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Transform ${stringifyState(target)}'s definition to [${def.type}:${
        def.id
      }]`,
    );
    this.mutate({
      type: "transformDefinition",
      state: target,
      newDefinition: def,
    });
    this.emitEvent("onTransformDefinition", this.state, target, def);
  }

  absorbDice(strategy: "seq" | "diff", count: number): DiceType[] {
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Absorb ${count} dice with strategy ${strategy}`,
    );
    const countMap = new Map<DiceType, number>();
    for (const dice of this.player.dice) {
      countMap.set(dice, (countMap.get(dice) ?? 0) + 1);
    }
    // 万能骰排最后。其余按照数量排序，相等时按照骰子类型排序
    const sorted = this.player.dice.toSortedBy((dice) => [
      dice === DiceType.Omni ? 0 : 1,
      -countMap.get(dice)!,
      dice,
    ]);
    switch (strategy) {
      case "seq": {
        const newDice = sorted.slice(0, count);
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: sorted.slice(count),
        });
        return newDice;
      }
      case "diff": {
        const collected: DiceType[] = [];
        const dice = [...sorted];
        for (let i = 0; i < count; i++) {
          let found = false;
          for (let j = 0; j < dice.length; j++) {
            // 万能骰子或者不重复的骰子
            if (dice[j] === DiceType.Omni || !collected.includes(dice[j])) {
              collected.push(dice[j]);
              dice.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            break;
          }
        }
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: dice,
        });
        return collected;
      }
      default: {
        const _: never = strategy;
        throw new GiTcgDataError(`Invalid strategy ${strategy}`);
      }
    }
  }
  convertDice(target: DiceType, count: number | "all") {
    if (count === "all") {
      count = this.player.dice.length;
    }
    const oldDiceCount = this.player.dice.length - count;
    const oldDice = this.player.dice.slice(0, oldDiceCount);
    const newDice = new Array<DiceType>(count).fill(target);
    const finalDice = sortDice(this.player, [...oldDice, ...newDice]);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Convert ${count} dice to [dice:${target}]`,
    );
    this.mutate({
      type: "resetDice",
      who: this.callerArea.who,
      value: finalDice,
    });
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    const maxCount = this.state.config.maxDice - this.player.dice.length;
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Generate ${count}${
        maxCount < count ? ` (only ${maxCount} due to limit)` : ""
      } dice of ${typeof type === "string" ? type : `[dice:${type}]`}`,
    );
    count = Math.min(count, maxCount);
    let insertedDice: DiceType[] = [];
    if (type === "randomElement") {
      const diceTypes = [
        DiceType.Anemo,
        DiceType.Cryo,
        DiceType.Dendro,
        DiceType.Electro,
        DiceType.Geo,
        DiceType.Hydro,
        DiceType.Pyro,
      ];
      for (let i = 0; i < count; i++) {
        const generated = this.random(diceTypes);
        insertedDice.push(generated);
        diceTypes.splice(diceTypes.indexOf(generated), 1);
      }
    } else {
      insertedDice = new Array<DiceType>(count).fill(type);
    }
    const newDice = sortDice(this.player, [
      ...this.player.dice,
      ...insertedDice,
    ]);
    this.mutate({
      type: "resetDice",
      who: this.callerArea.who,
      value: newDice,
    });
    for (const d of insertedDice) {
      this.emitEvent(
        "onGenerateDice",
        this.state,
        this.callerArea.who,
        this.skillInfo,
        d,
      );
    }
  }

  createHandCard(cardId: CardHandle) {
    const cardDef = this.state.data.cards.get(cardId);
    if (typeof cardDef === "undefined") {
      throw new GiTcgDataError(`Unknown card definition id ${cardId}`);
    }
    this.mutator.createHandCard(this.callerArea.who, cardDef);
  }

  drawCards(count: number, opt: DrawCardsOpt = {}) {
    const { withTag = null, withDefinition = null, who: myOrOpt = "my" } = opt;
    const who =
      myOrOpt === "my" ? this.callerArea.who : flip(this.callerArea.who);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Player ${who} draw ${count} cards, ${
        withTag ? `(with tag ${withTag})` : ""
      }`,
    );
    const cards: CardState[] = [];
    if (withTag === null && withDefinition === null) {
      // 如果没有限定，则从牌堆顶部摸牌
      for (let i = 0; i < count; i++) {
        const card = this.mutator.drawCard(who);
        if (card) {
          cards.push(card);
        }
      }
    } else {
      const check = (card: CardState) => {
        if (withDefinition !== null) {
          return card.definition.id === withDefinition;
        }
        if (withTag !== null) {
          return card.definition.tags.includes(withTag);
        }
        return false;
      };
      // 否则，随机选中一张满足条件的牌
      const player = () => this.state.players[who];
      for (let i = 0; i < count; i++) {
        const candidates = player().piles.filter(check);
        if (candidates.length === 0) {
          break;
        }
        const chosen = this.random(candidates);
        this.mutate({
          type: "transferCard",
          from: "piles",
          to: "hands",
          who,
          value: chosen,
        });
        cards.push(chosen);
        if (player().hands.length > this.state.config.maxHands) {
          this.mutate({
            type: "removeCard",
            who,
            where: "hands",
            oldState: chosen,
            reason: "overflow",
          });
        }
      }
    }
    for (const card of cards) {
      this.emitEvent("onDrawCard", this.state, who, card);
    }
  }

  private insertPileCards(
    payloads: InsertPilePayload[],
    strategy: InsertPileStrategy,
    where: "my" | "opp"
  ) {
    const count = payloads.length;
    const who = where === "my" ? this.callerArea.who : flip(this.callerArea.who);
    const player = this.state.players[who];
    switch (strategy) {
      case "top":
        for (const mut of payloads) {
          this.mutate({
            ...mut,
            who,
            targetIndex: 0,
          });
        }
        break;
      case "bottom":
        for (const mut of payloads) {
          const targetIndex = player.piles.length;
          this.mutate({
            ...mut,
            who,
            targetIndex,
          });
        }
        break;
      case "random":
        for (let i = 0; i < count; i++) {
          const mut: Mutation = {
            type: "stepRandom",
            value: -1,
          };
          this.mutate(mut);
          const index = mut.value % (player.piles.length + 1);
          this.mutate({
            ...payloads[i],
            who,
            targetIndex: index,
          });
        }
        break;
      case "spaceAround":
        const spaces = count + 1;
        const step = Math.floor(player.piles.length / spaces);
        const rest = player.piles.length % spaces;
        for (let i = 0, j = step; i < count; i++, j += step) {
          if (i < rest) {
            j++;
          }
          this.mutate({
            ...payloads[i],
            who,
            targetIndex: i + j,
          });
        }
        break;
      default: {
        if (strategy.startsWith("topRange")) {
          const range = Number(strategy.slice(8));
          if (isNaN(range)) {
            throw new GiTcgDataError(`Invalid strategy ${strategy}`);
          }
          for (let i = 0; i < count; i++) {
            const mut: Mutation = {
              type: "stepRandom",
              value: -1,
            };
            this.mutate(mut);
            const index = mut.value % range;
            this.mutate({
              ...payloads[i],
              who,
              targetIndex: index,
            });
          }
        } else  if (strategy.startsWith("topIndex")) {
          const index = Number(strategy.slice(8));
          if (isNaN(index)) {
            throw new GiTcgDataError(`Invalid strategy ${strategy}`);
          }
          for (let i = 0; i < count; i++) {
            this.mutate({
              ...payloads[i],
              who,
              targetIndex: index,
            });
          }
        } else {
          throw new GiTcgDataError(`Invalid strategy ${strategy}`);
        }
      }
    }
  }

  createPileCards(
    cardId: CardHandle,
    count: number,
    strategy: InsertPileStrategy,
    where: "my" | "opp" = "my",
  ) {
    const who = where === "my" ? this.callerArea.who : flip(this.callerArea.who);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Create pile cards ${count} * [card:${cardId}], strategy ${strategy}`,
    );
    const cardDef = this.state.data.cards.get(cardId);
    if (typeof cardDef === "undefined") {
      throw new GiTcgDataError(`Unknown card definition id ${cardId}`);
    }
    const cardTemplate = {
      id: 0,
      definition: cardDef,
    };
    const payloads = Array.from(
      { length: count },
      () =>
        ({
          type: "createCard",
          who,
          target: "piles",
          value: { ...cardTemplate },
        }) as const,
    );
    this.insertPileCards(payloads, strategy, where);
  }
  undrawCards(cards: CardState[], strategy: InsertPileStrategy) {
    const who = this.callerArea.who;
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Undraw cards ${cards
        .map((c) => `[card:${c.definition.id}]`)
        .join(", ")}, strategy ${strategy}`,
    );
    const payloads = cards.map(
      (card) =>
        ({
          type: "transferCard",
          from: "hands",
          to: "piles",
          who,
          value: card,
        }) as const,
    );
    this.insertPileCards(payloads, strategy, "my");
  }

  stealHandCard(card: CardState) {
    this.mutate({
      type: "transferCard",
      from: "hands",
      to: "oppHands",
      who: flip(this.callerArea.who),
      value: card,
    });
  }

  /** 弃置一张行动牌，并触发其“弃置时”效果。 */
  disposeCard(...cards: CardState[]) {
    const player = this.player;
    const who = this.callerArea.who;
    for (const card of cards) {
      let where: "hands" | "piles";
      if (player.hands.find((c) => c.id === card.id)) {
        where = "hands";
      } else if (player.piles.find((c) => c.id === card.id)) {
        where = "piles";
      } else {
        throw new GiTcgDataError(
          `Cannot dispose card ${stringifyState(
            card,
          )} from player ${who}, not found in either hands or piles`,
        );
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Dispose card ${stringifyState(card)} from player ${who}`,
      );
      this.mutate({
        type: "removeCard",
        who,
        where,
        oldState: card,
        reason: "disposed",
      });
      this.emitEvent("requestDisposeCard", this.skillInfo, who, card);
      const method: DisposeOrTuneMethod =
        where === "hands" ? "disposeFromHands" : "disposeFromPiles";
      this.emitEvent("onDisposeOrTuneCard", this.state, who, card, method);
    }
  }

  /**
   * 在 `cards` 中随机选择 `count` 张行动牌。**不会**步进随机迭代器。
   * @param cards
   * @param count 默认为 1
   */
  randomCard(cards: CardState[], count = 1) {
    const tb = (card: CardState) => {
      return nextRandom(card.id) ^ this.state.iterators.random;
    };
    return cards.toSorted((a, b) => tb(a) - tb(b)).slice(0, count);
  }

  /**
   * 等价于 `disposeCard(...randomCards(cards, count))`。
   */
  disposeRandomCard(cards: CardState[], count = 1) {
    const disposed = this.randomCard(cards, count);
    this.disposeCard(...disposed);
    return disposed;
  }

  setExtensionState(setter: Setter<Meta["associatedExtension"]["type"]>) {
    const oldState = this.getExtensionState();
    const newState = produce(oldState, (d) => {
      setter(d);
    });
    this.mutate({
      type: "mutateExtensionState",
      extensionId: this.skillInfo.associatedExtensionId!,
      newState,
    });
  }

  switchCards() {
    this.emitEvent("requestSwitchHands", this.skillInfo, this.callerArea.who);
  }
  rerollDice(times: number) {
    this.emitEvent("requestReroll", this.skillInfo, this.callerArea.who, times);
  }
  triggerEndPhaseSkill(target: EntityState) {
    this.emitEvent(
      "requestTriggerEndPhaseSkill",
      this.skillInfo,
      this.callerArea.who,
      target,
    );
  }
  useSkill(skillId: SkillHandle) {
    this.emitEvent(
      "requestUseSkill",
      this.skillInfo,
      this.callerArea.who,
      skillId,
    );
  }

  selectAndSummon(summons: (SummonHandle | EntityDefinition)[]) {
    this.emitEvent("requestSelectCard", this.skillInfo, this.callerArea.who, {
      type: "createEntity",
      cards: summons.map((defOrId) => {
        if (typeof defOrId === "number") {
          const def = this.state.data.entities.get(defOrId);
          if (!def) {
            throw new GiTcgDataError(`Unknown entity definition id ${defOrId}`);
          }
          return def;
        } else {
          return defOrId;
        }
      }),
    });
  }
  selectAndCreateHandCard(cards: (CardHandle | CardDefinition)[]) {
    this.emitEvent("requestSelectCard", this.skillInfo, this.callerArea.who, {
      type: "createHandCard",
      cards: cards.map((defOrId) => {
        if (typeof defOrId === "number") {
          const def = this.state.data.cards.get(defOrId);
          if (!def) {
            throw new GiTcgDataError(`Unknown card definition id ${defOrId}`);
          }
          return def;
        } else {
          return defOrId;
        }
      }),
    });
  }

  private getRandomValue() {
    const mutation: Mutation = {
      type: "stepRandom",
      value: -1,
    };
    this.mutate(mutation);
    return mutation.value;
  }

  random<T>(items: readonly T[]): T {
    return items[this.getRandomValue() % items.length];
  }
  private shuffleTail<T>(items: readonly T[], count: number): T[] {
    const itemsCopy = [...items];
    for (let i = itemsCopy.length - 1; i >= itemsCopy.length - count; i--) {
      const j = this.getRandomValue() % (i + 1);
      [itemsCopy[i], itemsCopy[j]] = [itemsCopy[j], itemsCopy[i]];
    }
    return itemsCopy;
  }
  shuffle<T>(items: readonly T[]): T[] {
    return this.shuffleTail(items, items.length);
  }
  randomSubset<T>(items: readonly T[], count: number): T[] {
    const partiallyShuffled = this.shuffleTail(items, count);
    return partiallyShuffled.slice(-count);
  }
}

type InternalProp = "callerArea";

type SkillContextMutativeProps =
  | "mutate"
  | "events"
  | "emitEvent"
  | "switchActive"
  | "gainEnergy"
  | "heal"
  | "damage"
  | "apply"
  | "createEntity"
  | "summon"
  | "combatStatus"
  | "characterStatus"
  | "dispose"
  | "transferEntity"
  | "setVariable"
  | "addVariable"
  | "addVariableWithMax"
  | "consumeUsage"
  | "consumeUsagePerRound"
  | "transformDefinition"
  | "absorbDice"
  | "convertDice"
  | "generateDice"
  | "createHandCard"
  | "createPileCards"
  | "disposeCard"
  | "disposeRandomCard"
  | "drawCards"
  | "undrawCards"
  | "stealHandCard"
  | "setExtensionState"
  | "switchCards"
  | "reroll"
  | "useSkill"
  | "selectAndSummon"
  | "selectAndCreateHandCard";

/**
 * 所谓 `Typed` 是指，若 `Readonly` 则忽略那些可以改变游戏状态的方法。
 *
 * `TypedCharacter` 等同理。
 */
export type TypedSkillContext<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<SkillContext<Meta>, SkillContextMutativeProps | InternalProp>
    : Omit<SkillContext<Meta>, InternalProp>;

export type CharacterPosition = "active" | "next" | "prev" | "standby";

/**
 * 提供一些针对角色的便利方法，不需要 SkillContext 参与。
 * 仅当保证 GameState 不发生变化时使用。
 */
export class CharacterBase {
  protected _area: EntityArea;
  constructor(
    private gameState: GameState,
    protected readonly _id: number,
  ) {
    this._area = getEntityArea(gameState, _id);
  }
  get area() {
    return this._area;
  }
  get who() {
    return this._area.who;
  }
  get id() {
    return this._id;
  }
  positionIndex(currentState: GameState = this.gameState) {
    const player = currentState.players[this.who];
    const thisIdx = player.characters.findIndex((ch) => ch.id === this._id);
    if (thisIdx === -1) {
      throw new GiTcgCoreInternalError("Invalid character index");
    }
    return thisIdx;
  }
  satisfyPosition(
    pos: CharacterPosition,
    currentState: GameState = this.gameState,
  ) {
    const player = currentState.players[this.who];
    const activeIdx = getActiveCharacterIndex(player);
    const length = player.characters.length;
    let dx;
    switch (pos) {
      case "active":
        return player.activeCharacterId === this._id;
      case "standby":
        return player.activeCharacterId !== this._id;
      case "next":
        dx = 1;
        break;
      case "prev":
        dx = -1;
        break;
      default: {
        const _: never = pos;
        throw new GiTcgDataError(`Invalid position ${pos}`);
      }
    }
    // find correct next and prev index
    let currentIdx = activeIdx;
    do {
      currentIdx = (currentIdx + dx + length) % length;
    } while (!player.characters[currentIdx].variables.alive);
    return player.characters[currentIdx].id === this._id;
  }
}

export class Character<Meta extends ContextMetaBase> extends CharacterBase {
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    id: number,
  ) {
    super(skillContext.state, id);
  }

  get state(): CharacterState {
    const entity = getEntityById(this.skillContext.state, this._id, true);
    if (entity.definition.type !== "character") {
      throw new GiTcgCoreInternalError("Expected character");
    }
    return entity as CharacterState;
  }
  get definition(): CharacterDefinition {
    return this.state.definition;
  }

  get health(): number {
    return this.getVariable("health");
  }
  get energy(): number {
    return this.getVariable("energy");
  }
  get aura(): Aura {
    return this.getVariable("aura");
  }
  get maxHealth(): number {
    return this.getVariable("maxHealth");
  }
  get maxEnergy(): number {
    return this.getVariable("maxEnergy");
  }
  positionIndex() {
    return super.positionIndex(this.skillContext.state);
  }
  satisfyPosition(pos: CharacterPosition) {
    return super.satisfyPosition(pos, this.skillContext.state);
  }
  isActive() {
    return this.satisfyPosition("active");
  }
  isMine() {
    return this.area.who === this.skillContext.callerArea.who;
  }
  fullEnergy() {
    return this.getVariable("energy") === this.getVariable("maxEnergy");
  }
  element(): DiceType {
    return elementOfCharacter(this.state.definition);
  }
  weaponTag(): WeaponTag {
    return weaponOfCharacter(this.state.definition);
  }
  nationTags(): NationTag[] {
    return nationOfCharacter(this.state.definition);
  }
  private hasEquipmentWithTag(tag: EntityTag): EntityState | null {
    return (
      this.state.entities.find(
        (v) =>
          v.definition.type === "equipment" && v.definition.tags.includes(tag),
      ) ?? null
    );
  }
  hasArtifact() {
    return this.hasEquipmentWithTag("artifact");
  }
  hasWeapon() {
    return this.hasEquipmentWithTag("weapon");
  }
  hasTechnique() {
    return this.hasEquipmentWithTag("technique");
  }
  hasEquipment(id: EquipmentHandle): EntityState | null {
    return (
      this.state.entities.find(
        (v) => v.definition.type === "equipment" && v.definition.id === id,
      ) ?? null
    );
  }
  hasStatus(id: StatusHandle): EntityState | null {
    return (
      this.state.entities.find(
        (v) => v.definition.type === "status" && v.definition.id === id,
      ) ?? null
    );
  }

  $$<const Q extends string>(arg: Q) {
    return this.skillContext.$(`(${arg}) at (with id ${this._id})`);
  }

  // MUTATIONS

  gainEnergy(value = 1) {
    this.skillContext.gainEnergy(value, this.state);
  }
  heal(value: number, opt?: HealOption) {
    this.skillContext.heal(value, this.state, opt);
  }
  damage(type: DamageType, value: number) {
    this.skillContext.damage(type, value, this.state);
  }
  apply(type: AppliableDamageType) {
    this.skillContext.apply(type, this.state);
  }
  addStatus(status: StatusHandle, opt?: CreateEntityOptions) {
    this.skillContext.createEntity("status", status, this._area, opt);
  }
  equip(equipment: EquipmentHandle, opt?: CreateEntityOptions) {
    // Remove existing artifact/weapon/technique first
    for (const tag of ["artifact", "weapon", "technique"] as const) {
      if (
        this.skillContext.state.data.entities.get(equipment)?.tags.includes(tag)
      ) {
        const exist = this.state.entities.find((v) =>
          v.definition.tags.includes(tag),
        );
        if (exist) {
          this.skillContext.dispose(exist);
        }
      }
    }
    this.skillContext.createEntity("equipment", equipment, this._area, opt);
  }
  removeArtifact(): EntityState | null {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("artifact"),
    );
    if (!entity) {
      return null;
    }
    this.skillContext.dispose(entity);
    return entity;
  }
  removeWeapon(): EntityState | null {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("weapon"),
    );
    if (!entity) {
      return null;
    }
    this.skillContext.dispose(entity);
    return entity;
  }
  loseEnergy(count = 1): number {
    const originalValue = this.state.variables.energy;
    const finalValue = Math.max(0, originalValue - count);
    this.skillContext.setVariable("energy", finalValue, this.state);
    return originalValue - finalValue;
  }
  getVariable<Name extends string>(name: Name): CharacterVariables[Name] {
    return this.state.variables[name];
  }

  setVariable(prop: string, value: number) {
    this.skillContext.setVariable(prop, value, this.state);
  }
  addVariable(prop: string, value: number) {
    this.skillContext.addVariable(prop, value, this.state);
  }
  addVariableWithMax(prop: string, value: number, maxLimit: number) {
    this.skillContext.addVariableWithMax(prop, value, maxLimit, this.state);
  }
  dispose(): never {
    throw new GiTcgDataError(`Cannot dispose character (or passive skill)`);
  }
}

type CharacterMutativeProps =
  | "gainEnergy"
  | "heal"
  | "damage"
  | "apply"
  | "addStatus"
  | "equip"
  | "removeArtifact"
  | "removeWeapon"
  | "setVariable"
  | "addVariable"
  | "addVariableWithMax"
  | "dispose";

export type TypedCharacter<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<Character<Meta>, CharacterMutativeProps>
    : Character<Meta>;

export class Entity<Meta extends ContextMetaBase> {
  private readonly _area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    public readonly id: number,
  ) {
    this._area = getEntityArea(skillContext.state, id);
  }

  get state(): EntityState {
    return getEntityById(this.skillContext.state, this.id);
  }
  get definition(): EntityDefinition {
    return this.state.definition;
  }
  get area(): EntityArea {
    return this._area;
  }
  get who() {
    return this._area.who;
  }
  isMine() {
    return this.area.who === this.skillContext.callerArea.who;
  }
  getVariable<Name extends string>(name: Name): EntityVariables[Name] {
    return this.state.variables[name];
  }

  master() {
    if (this._area.type !== "characters") {
      throw new GiTcgDataError("master() expect a character area");
    }
    return new Character<Meta>(this.skillContext, this._area.characterId);
  }

  setVariable(prop: string, value: number) {
    this.skillContext.setVariable(prop, value, this.state);
  }
  addVariable(prop: string, value: number) {
    this.skillContext.addVariable(prop, value, this.state);
  }
  addVariableWithMax(prop: string, value: number, maxLimit: number) {
    this.skillContext.addVariableWithMax(prop, value, maxLimit, this.state);
  }
  consumeUsage(count = 1) {
    this.skillContext.consumeUsage(count, this.state);
  }
  resetUsagePerRound() {
    for (const [name, cfg] of Object.entries(
      this.state.definition.varConfigs,
    )) {
      if (
        (USAGE_PER_ROUND_VARIABLE_NAMES as readonly string[]).includes(name)
      ) {
        this.setVariable(name, cfg.initialValue);
      }
    }
  }
  dispose() {
    this.skillContext.dispose(this.state);
  }
}

type EntityMutativeProps =
  | "setVariable"
  | "addVariable"
  | "addVariableWithMax"
  | "consumeUsage"
  | "resetUsagePerRound"
  | "dispose";

export type TypedEntity<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<Entity<Meta>, EntityMutativeProps>
    : Entity<Meta>;
