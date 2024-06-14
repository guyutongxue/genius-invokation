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
  AnyState,
  CharacterState,
  EntityState,
  GameState,
} from "../base/state";
import {
  CardTag,
  CardSkillEventArg,
  CardTargetKind,
  CardType,
  PlayCardFilter,
  PlayCardTargetGetter,
  SupportTag,
  WeaponCardTag,
  PlayCardSkillDefinition,
  CardDefinition,
  DisposeCardSkillDefinition,
} from "../base/card";
import { CharacterTag } from "../base/character";
import {
  DescriptionDictionary,
  DescriptionDictionaryEntry,
  DescriptionDictionaryKey,
  ExEntityType,
} from "../base/entity";
import { SkillDescription, SkillInfo } from "../base/skill";
import { registerCard, registerSkill } from "./registry";
import { SkillContext } from "./context";
import {
  SkillBuilderWithCost,
  enableShortcut,
  BuilderWithShortcut,
  SkillFilter,
  ReadonlyMetaOf,
  SkillOperation,
  WritableMetaOf,
} from "./skill";
import {
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  ExtensionHandle,
  StatusHandle,
  SupportHandle,
} from "./type";
import { combatStatus, status, equipment, support } from "./entity";
import { GuessedTypeOfQuery } from "../query/types";
import { GiTcgDataError } from "../error";
import { Writable } from "../utils";
import { Version, VersionInfo, DEFAULT_VERSION_INFO } from "../base/version";

type StateOf<TargetKindTs extends CardTargetKind> =
  TargetKindTs extends readonly [
    infer First extends ExEntityType,
    ...infer Rest extends CardTargetKind,
  ]
    ? readonly [
        First extends "character" ? CharacterState : EntityState,
        ...StateOf<Rest>,
      ]
    : readonly [];

interface StrictCardSkillEventArg<TargetKindTs extends CardTargetKind> {
  targets: StateOf<TargetKindTs>;
}

type LooseBuilderMetaForCard = {
  callerType: "character";
  callerVars: never;
  eventArgType: CardSkillEventArg;
  associatedExtension: never;
};

type StrictBuilderMetaForCard<
  KindTs extends CardTargetKind,
  AssociatedExt extends ExtensionHandle,
> = {
  callerType: "character";
  callerVars: never;
  eventArgType: StrictCardSkillEventArg<KindTs>;
  associatedExtension: AssociatedExt;
};

type BuilderMetaForCardDispose<AssociatedExt extends ExtensionHandle> = {
  callerType: "character";
  callerVars: never;
  eventArgType: void;
  associatedExtension: AssociatedExt;
};

type StrictCardSkillFilter<
  KindTs extends CardTargetKind,
  AssociatedExt extends ExtensionHandle,
> = SkillFilter<StrictBuilderMetaForCard<KindTs, AssociatedExt>>;

type TargetQuery =
  | `${string}character${string}`
  | `${string}summon${string}`
  | `${string}support${string}`;
type TargetKindOfQuery<Q extends TargetQuery> = GuessedTypeOfQuery<Q>;

const SATIATED_ID = 303300 as StatusHandle;

type TalentRequirement = "action" | "active" | "none";

interface FoodOption {
  satiatedTarget?: string;
  extraTargetRestraint?: string;
}
type CardArea = { readonly who: 0 | 1 };
type CardDescriptionDictionaryGetter<AssociatedExt extends ExtensionHandle> = (
  st: GameState,
  self: { readonly area: CardArea },
  ext: AssociatedExt["type"],
) => string | number;

class CardBuilder<
  KindTs extends CardTargetKind,
  AssociatedExt extends ExtensionHandle = never,
> extends SkillBuilderWithCost<StrictCardSkillEventArg<KindTs>, AssociatedExt> {
  private _type: CardType = "event";
  private _tags: CardTag[] = [];
  private _filters: StrictCardSkillFilter<KindTs, AssociatedExt>[] = [];
  /**
   * 在料理卡牌的行动结尾添加“设置饱腹状态”操作的目标；
   * `null` 表明不添加（不是料理牌或者手动指定）
   */
  private _satiatedTarget: string | null = null;
  private _doSameWhenDisposed = false;
  private _disposeOperation: SkillOperation<
    BuilderMetaForCardDispose<AssociatedExt>
  > | null = null;
  private _targetQueries: string[] = [];
  private _descriptionDictionary: Writable<DescriptionDictionary> = {};
  private _versionInfo: VersionInfo = DEFAULT_VERSION_INFO;

  constructor(private readonly cardId: number) {
    super(cardId);
  }

  since(version: Version) {
    this._versionInfo = { predicate: "since", version };
    return this;
  }
  until(version: Version) {
    this._versionInfo = { predicate: "until", version };
  }

  replaceDescription(
    key: DescriptionDictionaryKey,
    getter: CardDescriptionDictionaryGetter<AssociatedExt>,
  ) {
    if (Reflect.has(this._descriptionDictionary, key)) {
      throw new GiTcgDataError(`Description key ${key} already exists`);
    }
    const entry: DescriptionDictionaryEntry = (st, id) => {
      const ext = st.extensions.find(
        (ext) => ext.definition.id === this.associatedExtensionId,
      );
      const who = st.players[0].hands.find((c) => c.id === id) ? 0 : 1;
      return String(getter(st, { area: { who } }, ext?.state));
    };
    this._descriptionDictionary[key] = entry;
    return this;
  }

  associateExtension<NewExtT>(ext: ExtensionHandle<NewExtT>) {
    if (typeof this.associatedExtensionId !== "undefined") {
      throw new GiTcgDataError(
        `This card has already associated with extension ${this.id}`,
      );
    }
    this.associatedExtensionId = ext;
    return this as unknown as CardBuilder<KindTs, ExtensionHandle<NewExtT>>;
  }

  tags(...tags: CardTag[]): this {
    this._tags.push(...tags);
    return this;
  }
  type(type: CardType): this {
    this._type = type;
    return this;
  }

  equipment<Q extends TargetQuery>(target: Q) {
    this.type("equipment")
      .addTarget(target)
      .do((c) => {
        c.$("character and @targets.0")?.equip(this.cardId as EquipmentHandle);
      })
      .done();
    return equipment(this.cardId);
  }
  weapon(type: WeaponCardTag) {
    return this.tags("weapon", type)
      .equipment(`my characters with tag (${type})`)
      .tags("weapon", type);
  }
  artifact() {
    return this.tags("artifact").equipment("my characters").tags("artifact");
  }
  support(type: SupportTag) {
    this.type("support").tags(type);
    this.do((c, e) => {
      // 支援牌的目标是要弃置的支援区卡牌
      const targets = e.targets as readonly EntityState[];
      if (targets.length > 0) {
        c.dispose(targets[0]);
      }
      c.createEntity("support", this.cardId as SupportHandle);
    }).done();
    return support(this.cardId).tags(type);
  }

  /**
   * 添加“打出后生成出战状态”的操作。
   *
   * 此调用后，卡牌描述结束；接下来的 builder 将描述出战状态。
   * @param id 出战状态定义 id；默认与卡牌定义 id 相同
   * @returns 出战状态 builder
   */
  toCombatStatus(id?: number, where?: "my" | "opp") {
    id ??= this.cardId;
    this.do((c) => {
      c.combatStatus(id as CombatStatusHandle, where);
    }).done();
    return combatStatus(id);
  }
  /**
   * 添加“打出后为某角色附着状态”的操作。
   *
   * 此调用后，卡牌描述结束；接下来的 builder 将描述状态。
   * @param target 要附着的角色（查询）
   * @param id 状态定义 id；默认与卡牌定义 id 相同
   * @returns 状态 builder
   */
  toStatus(target: string, id?: number) {
    id ??= this.cardId;
    this.do((c) => {
      c.characterStatus(id as StatusHandle, target);
    }).done();
    return status(id);
  }

  addTarget<Q extends TargetQuery>(
    targetQuery: Q,
  ): BuilderWithShortcut<
    CardBuilder<readonly [...KindTs, TargetKindOfQuery<Q>]>
  > {
    this._targetQueries = [...this._targetQueries, targetQuery];
    return this as any;
  }

  legend(): this {
    return this.tags("legend").filter((c) => !c.player.legendUsed);
  }

  /**
   * 执行通用的天赋牌准备工作。
   * - 设置 talent 标签
   * - 若是出战行动，设置 action 标签
   * - 设置牌组需求
   * - 若要求该角色出战，则设置 filter
   * @returns 打出目标需求
   */
  private prepareTalent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement,
  ): `${string}character${string}` {
    this.tags("talent");
    let extraCond = "";
    if (requires === "action") {
      this.tags("action");
      // 出战行动的天赋牌，要求目标未被控制
      extraCond = "and not has status with tag (disableSkill)";
    }
    let chs: CharacterHandle[];
    if (Array.isArray(ch)) {
      chs = ch;
    } else {
      chs = [ch];
    }
    if (requires !== "none") {
      // 出战角色须为天赋角色
      this.filter((c) =>
        chs.includes(c.$("my active")!.state.definition.id as CharacterHandle),
      );
    }

    return chs
      .map((c) => `(my characters with definition id ${c} ${extraCond})`)
      .join(" or ") as any;
  }

  talent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "action",
  ) {
    const equipQuery = this.prepareTalent(ch, requires);
    return this.equipment(equipQuery).tags("talent");
  }

  eventTalent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "action",
  ) {
    const targetQuery = this.prepareTalent(ch, requires);
    return this.addTarget(targetQuery);
  }

  filter(pred: StrictCardSkillFilter<KindTs, AssociatedExt>): this {
    this._filters.push(pred);
    return this;
  }

  // 增加 food 标签，增加目标（我方非饱腹角色）
  food(opt?: FoodOption) {
    this._satiatedTarget = opt?.satiatedTarget ?? "@targets.0";
    const defaultTarget =
      "my characters and not has status with definition id = 303300";
    let target;
    if (opt?.extraTargetRestraint) {
      target = `(${defaultTarget}) and (${opt.extraTargetRestraint})`;
    } else {
      target = defaultTarget;
    }
    return this.tags("food").addTarget(target as "character");
  }

  private generateTargetList(
    state: GameState,
    skillInfo: SkillInfo,
    known: AnyState[],
    targetQuery: string[],
  ): AnyState[][] {
    if (targetQuery.length === 0) {
      return [[]];
    }
    const [first, ...rest] = targetQuery;
    const ctx = new SkillContext<ReadonlyMetaOf<LooseBuilderMetaForCard>>(
      state,
      skillInfo,
      {
        targets: known,
      },
    );
    const states = ctx.$$(first).map((c) => c.state);
    return states.flatMap((st) =>
      this.generateTargetList(state, skillInfo, [...known, st], rest).map(
        (l) => [st, ...l],
      ),
    );
  }

  doSameWhenDisposed() {
    if (this._disposeOperation !== null) {
      throw new GiTcgDataError(
        `Cannot specify dispose action when using .doSameWhenDisposed().`,
      );
    }
    if (this._targetQueries.length > 0) {
      throw new GiTcgDataError(
        `Cannot specify targets when using .doSameWhenDisposed().`,
      );
    }
    this._doSameWhenDisposed = true;
    return this;
  }
  onDispose(op: SkillOperation<BuilderMetaForCardDispose<AssociatedExt>>) {
    if (this._doSameWhenDisposed) {
      throw new GiTcgDataError(
        `Cannot specify dispose action when using .doSameWhenDisposed().`,
      );
    }
    this._disposeOperation = op;
    return this;
  }

  done(): CardHandle {
    if (this._targetQueries.length > 0 && this._doSameWhenDisposed) {
      throw new GiTcgDataError(
        `Cannot specify targets when using .doSameWhenDisposed().`,
      );
    }
    if (this._satiatedTarget !== null) {
      const target = this._satiatedTarget;
      this.operations.push((c) => c.characterStatus(SATIATED_ID, target));
    }
    const action: SkillDescription<CardSkillEventArg> = (
      state,
      skillInfo,
      arg,
    ) => {
      return this.applyActions(state, skillInfo, arg as any);
    };
    const filterFn: PlayCardFilter = (state, skillInfo, args) => {
      const ctx = new SkillContext<
        ReadonlyMetaOf<StrictBuilderMetaForCard<KindTs, AssociatedExt>>
      >(state, skillInfo, args as any);
      for (const filter of this._filters) {
        if (!filter(ctx, ctx.eventArg)) {
          return false;
        }
      }
      return true;
    };
    const targetGetter: PlayCardTargetGetter = (state, skillInfo) => {
      const targetIdsList = this.generateTargetList(
        state,
        skillInfo,
        [],
        this._targetQueries,
      );
      return targetIdsList.map((targets) => ({ targets }));
    };
    const skillDef: PlayCardSkillDefinition = {
      __definition: "skills",
      type: "skill",
      skillType: "playCard",
      id: this.cardId,
      version: this._versionInfo,
      triggerOn: null,
      requiredCost: this._cost,
      gainEnergy: false,
      action,
    };
    registerSkill(skillDef);
    let onDispose: DisposeCardSkillDefinition | undefined = void 0;
    if (this._doSameWhenDisposed || this._disposeOperation !== null) {
      const disposeOp = this._disposeOperation;
      const disposeAction = disposeOp ? <SkillDescription<void>>((
            state,
            skillInfo,
            arg,
          ) => {
            const ctx = new SkillContext<
              WritableMetaOf<BuilderMetaForCardDispose<AssociatedExt>>
            >(state, skillInfo, arg);
            disposeOp(ctx, {});
            ctx._terminate();
            return [ctx.state, ctx.events];
          }) : (action as unknown as SkillDescription<void>);
      const disposeDef: DisposeCardSkillDefinition = {
        __definition: "skills",
        type: "skill",
        skillType: "disposeCard",
        id: this.cardId + 0.01,
        version: this._versionInfo,
        triggerOn: null,
        requiredCost: [],
        gainEnergy: false,
        action: disposeAction, // FIX ME maybe
      };
      registerSkill(disposeDef);
      onDispose = disposeDef;
    }
    const cardDef: CardDefinition = {
      __definition: "cards",
      id: this.cardId,
      type: this._type,
      version: this._versionInfo,
      tags: this._tags,
      getTarget: targetGetter,
      filter: filterFn,
      onPlay: skillDef,
      onDispose: onDispose,
      descriptionDictionary: {}, // TODO
    };
    registerCard(cardDef);
    return this.cardId as CardHandle;
  }
}

export function card(id: number) {
  return enableShortcut(new CardBuilder<readonly []>(id));
}
