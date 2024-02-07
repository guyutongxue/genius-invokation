import {
  CardTag,
  CardSkillEventArg,
  CardTargetKind,
  CardType,
  DeckRequirement,
  PlayCardFilter,
  PlayCardTargetGetter,
  SupportTag,
  WeaponCardTag,
} from "../base/card";
import { registerCard, registerSkill } from "./registry";
import { SkillDescription, SkillInfo } from "../base/skill";
import { Character, SkillContext } from "./context";
import {
  SkillBuilderWithCost,
  enableShortcut,
  BuilderWithShortcut,
  SkillFilter,
  ReadonlyMetaOf,
} from "./skill";
import {
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  StatusHandle,
  SupportHandle,
} from "./type";
import {
  AnyState,
  CharacterState,
  EntityState,
  GameState,
} from "../base/state";
import { getEntityById } from "../util";
import { combatStatus, status } from ".";
import { equipment, support } from "./entity";
import { CharacterTag } from "../base/character";
import { ExEntityType } from "../base/entity";
import { GuessedTypeOfQuery } from "../query/types";

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
};

type StrictBuilderMetaForCard<KindTs extends CardTargetKind> = {
  callerType: "character";
  callerVars: never;
  eventArgType: StrictCardSkillEventArg<KindTs>;
};

type StrictCardSkillFilter<KindTs extends CardTargetKind> = SkillFilter<
  StrictBuilderMetaForCard<KindTs>
>;

type TargetQuery = `${string}character${string}` | `${string}summon${string}` | `${string}support${string}`;
type TargetKindOfQuery<Q extends TargetQuery> = GuessedTypeOfQuery<Q>;

const SATIATED_ID = 303300 as StatusHandle;

type TalentRequirement = "action" | "active" | "none";

class CardBuilder<KindTs extends CardTargetKind> extends SkillBuilderWithCost<
  StrictCardSkillEventArg<KindTs>
> {
  private _type: CardType = "event";
  private _tags: CardTag[] = [];
  private _filters: StrictCardSkillFilter<KindTs>[] = [];
  private _deckRequirement: DeckRequirement = {};
  /**
   * 在料理卡牌的行动结尾添加“设置饱腹状态”操作的目标；
   * `null` 表明不添加（不是料理牌或者手动指定）
   */
  private _satiatedTarget: string | null = null;

  private _targetQueries: string[] = [];

  constructor(private readonly cardId: number) {
    super(cardId);
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
    return this.tags("legend");
  }

  talent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "action",
  ) {
    let chs: CharacterHandle[];
    if (Array.isArray(ch)) {
      chs = ch;
    } else {
      chs = [ch];
    }
    this.eventTalent(chs, requires);
    if (requires !== "none") {
      // 出战角色须为天赋角色
      this.filter((c) =>
        chs.includes(c.$("my active")!.state.definition.id as CharacterHandle),
      );
    }
    const equiptQuery = chs
      .map((ch) => `(my characters with definition id ${ch})`)
      .join(" or ");
    return this.equipment(equiptQuery as "characters").tags("talent");
  }

  eventTalent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "action",
  ) {
    if (requires === "action") {
      this.tags("action");
    }
    if (Array.isArray(ch)) {
      this.requireCharacter(ch[0]);
    } else {
      this.requireCharacter(ch);
    }
    return this.tags("talent");
  }

  requireCharacterTag(tag: CharacterTag): this {
    this._deckRequirement.dualCharacterTag = tag;
    return this;
  }

  requireCharacter(ch: CharacterHandle): this {
    this._deckRequirement.character = ch;
    return this;
  }

  filter(pred: StrictCardSkillFilter<KindTs>): this {
    this._filters.push(pred);
    return this;
  }

  // 增加 food 标签，增加目标（我方非饱腹角色）
  food(opt?: { satiatedTarget?: string }) {
    this._satiatedTarget = opt?.satiatedTarget ?? "@targets.0";
    return this.tags("food").addTarget(
      "my characters and not has status with definition id = 303300",
    );
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

  done(): CardHandle {
    if (this._satiatedTarget !== null) {
      const target = this._satiatedTarget;
      this.operations.push((c) => c.characterStatus(SATIATED_ID, target));
    }
    const action: SkillDescription<CardSkillEventArg> = (
      state,
      skillInfo,
      args,
    ) => {
      return this.getAction(args as any)(state, skillInfo);
    };
    const filterFn: PlayCardFilter = (state, skillInfo, args) => {
      const ctx = new SkillContext<
        ReadonlyMetaOf<StrictBuilderMetaForCard<KindTs>>
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
    const skillDef = {
      type: "skill" as const,
      skillType: "card" as const,
      id: this.cardId,
      triggerOn: null,
      requiredCost: this._cost,
      action,
    };
    registerSkill(skillDef);
    registerCard({
      id: this.cardId,
      type: this._type,
      tags: this._tags,
      deckRequirement: this._deckRequirement,
      getTarget: targetGetter,
      filter: filterFn,
      skillDefinition: skillDef,
    });
    return this.cardId as CardHandle;
  }
}

export function card(id: number) {
  return enableShortcut(new CardBuilder<readonly []>(id));
}
