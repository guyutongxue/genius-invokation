import { flip } from "@gi-tcg/utils";
import { ExEntityType, ExContextType, ExTag, HandleT } from "./type";
import {
  CharacterContext,
  CharacterPosition,
  EntityContext,
  ExtendedSkillContext,
  SkillContext,
  StrictlyTypedCharacterContext,
} from "./context";
import { getActiveCharacterIndex, shiftLeft } from "../util";

type Filter<Readonly extends boolean, TypeT extends ExEntityType> = (
  e: ExContextType<Readonly, TypeT>,
) => boolean;
type ValuePred = number | ((v: number) => boolean);
type OrderFn<Readonly extends boolean, TypeT extends ExEntityType> = (
  e: ExContextType<Readonly, TypeT>,
) => number;

/**
 * 查询实体或角色的 builder。
 * @tparam Readonly 指示其查询结果是否是只读的类型。
 * @tparam TypeT 其查询的实体或角色类型，使用 `StrictlyQueryBuilder` 提供更好的类型信息。
 */
export class QueryBuilder<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  TypeT extends ExEntityType,
> {
  private _all = false;
  private _includeDefeated = false;
  private filters: Filter<Readonly, TypeT>[] = [];
  private _orderFn: OrderFn<Readonly, TypeT> | null = null;
  private callerWho: 0 | 1;
  constructor(
    private readonly skillContext: SkillContext<Readonly, Ext, CallerType>,
  ) {
    this.callerWho = this.skillContext.callerArea.who;
  }

  type<NewT extends ExEntityType>(
    type: NewT,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, NewT> {
    const self = this as unknown as QueryBuilder<
      Readonly,
      Ext,
      CallerType,
      NewT
    >;
    return self.filter((e) => e.state.definition.type === type);
  }
  character() {
    return this.type("character");
  }
  status() {
    return this.type("status");
  }
  combat() {
    return this.type("combatStatus");
  }
  equipment() {
    return this.type("equipment");
  }
  summon() {
    return this.type("summon");
  }
  support() {
    return this.type("support");
  }

  all(): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    this._all = true;
    return this;
  }

  opp(): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    this.callerWho = flip(this.callerWho);
    return this;
  }
  mine() {
    // no-op
    return this;
  }

  filter(
    ...filters: Filter<Readonly, TypeT>[]
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    this.filters.push(...filters);
    return this;
  }

  def(defId: HandleT<TypeT>) {
    return this.filter((e) => e.state.definition.id === defId);
  }

  tagged(tag: ExTag<TypeT>) {
    return this.filter((e) =>
      (e.state.definition.tags as string[]).includes(tag),
    );
  }

  valued(
    prop: CommonVariableName[TypeT],
    valOrPred: ValuePred,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT>;
  valued(
    prop: string,
    valOrPred: ValuePred,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT>;
  valued(
    prop: string,
    valOrPred: ValuePred,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    return this.filter((e) => {
      const v = e.state.variables[prop];
      if (typeof valOrPred === "function") {
        return valOrPred(v);
      } else {
        return v === valOrPred;
      }
    });
  }

  byId(
    id: number,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    return this.filter((e) => e.state.id === id);
  }
  self(): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, CallerType> {
    return this.byId(this.skillContext.callerId) as any;
  }
  get context(): ExtendedSkillContext<Readonly, Ext, CallerType> {
    return this.skillContext as any;
  }

  orderBy(
    fn: OrderFn<Readonly, TypeT>,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    this._orderFn = fn;
    return this;
  }

  many(): ExContextType<Readonly, TypeT>[] {
    const state = this.skillContext.state;
    const result: (CharacterContext<Readonly> | EntityContext<Readonly>)[] = [];
    let whoList;
    if (this._all) {
      whoList = [state.currentTurn, flip(state.currentTurn)];
    } else {
      whoList = [this.callerWho];
    }
    for (const who of whoList) {
      const player = state.players[who];
      const activeIdx = getActiveCharacterIndex(player);
      for (const ch of shiftLeft(player.characters, activeIdx)) {
        if (!this._includeDefeated && !ch.variables.alive) {
          continue;
        }
        result.push(new CharacterContext(this.skillContext, ch.id));
        result.push(
          ...ch.entities.map((e) => new EntityContext(this.skillContext, e.id)),
        );
      }

      for (const area of ["combatStatuses", "summons", "supports"] as const) {
        result.push(
          ...player[area].map(
            (e) => new EntityContext(this.skillContext, e.id),
          ),
        );
      }
    }
    const filtered = (result as ExContextType<Readonly, TypeT>[]).filter(
      (ctx) => this.filters.every((f) => f(ctx)),
    );
    if (this._orderFn) {
      filtered.sort((a, b) => this._orderFn!(a) - this._orderFn!(b));
    }
    return filtered;
  }

  one(): ExContextType<Readonly, TypeT> {
    const result = this.many();
    if (result.length === 0) {
      throw new Error("No entity found");
    }
    return result[0];
  }

  count(): number {
    return this.many().length;
  }

  // CHARACTER ONLY

  includeDefeated(): StrictlyTypedQueryBuilder<
    Readonly,
    Ext,
    CallerType,
    TypeT
  > {
    this._includeDefeated = true;
    return this;
  }

  energyNotFull() {
    return this.filter((e) => e instanceof CharacterContext && e.fullEnergy());
  }

  position(
    pos: CharacterPosition,
  ): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, "character"> {
    return this.type("character").filter(
      (e) => e instanceof CharacterContext && e.satisfyPosition(pos),
    );
  }
  active() {
    return this.position("active");
  }
  standby() {
    return this.position("standby");
  }
  next() {
    return this.position("next");
  }
  prev() {
    return this.position("prev");
  }

  recentOpp(): StrictlyTypedQueryBuilder<
    Readonly,
    Ext,
    CallerType,
    "character"
  > {
    const targetCh = this.one();
    if (!(targetCh instanceof CharacterContext)) {
      throw new Error("recentOpp() expected a character here");
    }
    const state = this.skillContext.state;
    const baseIdx = targetCh.positionIndex();
    const baseLen = state.players[targetCh.who].characters.length;
    const baseRatio = baseIdx - (baseLen / 2 - 0.5);
    const orderFn = (e: StrictlyTypedCharacterContext<Readonly>) => {
      const idx = e.positionIndex();
      const len = state.players[e.who].characters.length;
      const ratio = idx - (len / 2 - 0.5);
      return Math.abs(ratio - baseRatio);
    };
    return new QueryBuilder<Readonly, Ext, CallerType, ExEntityType>(
      this.skillContext,
    )
      .all()
      .character()
      .filter((e) => e.who === flip(targetCh.who))
      .orderBy(orderFn);
  }

  into(): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, "status"> {
    const targetCh = this.one();
    if (!(targetCh instanceof CharacterContext)) {
      throw new Error("into() expected a character here");
    }
    return new QueryBuilder<Readonly, Ext, CallerType, "status">(
      this.skillContext,
    ).filter((e) => {
      if (!(e instanceof EntityContext)) {
        return false;
      }
      return e.master().id === targetCh.id;
    });
  }

  // STATUS ONLY

  shield(): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, "status"> {
    return this.type("status").tagged("shield");
  }
}

type CommonQueryBuilderOmitProp =
  | "character"
  | "status"
  | "combat"
  | "equipment"
  | "summon"
  | "support";
type CharacterOnlyProp =
  | "energyNotFull"
  | "position"
  | "active"
  | "standby"
  | "next"
  | "prev"
  | "recentOpp"
  | "into";
type StatusOnlyProp = "shield";

type CommonVariableName = {
  character: "health" | "energy" | "aura";
  passiveSkill: never;
  status: "duration";
  combatStatus: "duration";
  equipment: never;
  summon: "duration";
  support: "duration";
};

type QueryBuilderOmitProp = {
  character: CommonQueryBuilderOmitProp | StatusOnlyProp;
  passiveSkill: CommonQueryBuilderOmitProp | CharacterOnlyProp;
  status: CommonQueryBuilderOmitProp | CharacterOnlyProp;
  combatStatus: CommonQueryBuilderOmitProp | CharacterOnlyProp;
  equipment: CommonQueryBuilderOmitProp | CharacterOnlyProp | StatusOnlyProp;
  summon: CommonQueryBuilderOmitProp | CharacterOnlyProp | StatusOnlyProp;
  support: CommonQueryBuilderOmitProp | CharacterOnlyProp | StatusOnlyProp;
};

export type StrictlyTypedQueryBuilder<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  TypeT extends ExEntityType,
> = ExEntityType extends TypeT
  ? QueryBuilder<Readonly, Ext, CallerType, TypeT>
  : Omit<
      QueryBuilder<Readonly, Ext, CallerType, TypeT>,
      QueryBuilderOmitProp[TypeT]
    >;

/**
 * 在指定某个角色目标时，可传入的参数类型：
 * - Query Lambda 形如 `$ => $.active()`
 *   - 该 Lambda 可返回 `QueryBuilder` 如上；
 *   - 也可返回具体的对象上下文，如 `$ => $.opp().one()`。
 * - 直接传入具体的对象上下文。
 */
export type TargetQueryArg<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> =
  | StrictlyTypedCharacterContext<Readonly>[]
  | StrictlyTypedCharacterContext<Readonly>
  | ((
      $: StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, ExEntityType>,
    ) =>
      | StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, "character">
      | StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, ExEntityType>
      | StrictlyTypedCharacterContext<Readonly>[]
      | StrictlyTypedCharacterContext<Readonly>);
