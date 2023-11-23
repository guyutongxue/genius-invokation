import { flip } from "@gi-tcg/utils";
import { EntityTag } from "../entity";
import { ExEntityType, ExContextType, ExTag, HandleT } from "./type";
import {
  CharacterContext,
  CharacterPosition,
  EntityContext,
  SkillContext,
  StrictlyTypedCharacterContext,
} from "./context";

type Filter<Readonly extends boolean, TypeT extends ExEntityType> = (
  e: ExContextType<Readonly, TypeT>,
) => boolean;
type ValuePred = number | ((v: number) => boolean);
type OrderFn<Readonly extends boolean, TypeT extends ExEntityType> = (
  e: ExContextType<Readonly, TypeT>,
) => number;

export class QueryBuilder<
  Readonly extends boolean,
  TypeT extends ExEntityType,
> {
  private _all = false;
  private _includeDefeated = false;
  private filters: Filter<Readonly, TypeT>[] = [];
  private _orderFn: OrderFn<Readonly, TypeT> | null = null;
  constructor(
    private readonly skillContext: SkillContext<Readonly>,
    private callerWho: 0 | 1,
  ) {}

  type<NewT extends ExEntityType>(
    type: NewT,
  ): StrictlyTypedQueryBuilder<Readonly, NewT> {
    const self = this as unknown as QueryBuilder<Readonly, NewT>;
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

  all(): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    this._all = true;
    return this;
  }

  opp(): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    this.callerWho = flip(this.callerWho);
    return this;
  }

  filter(
    ...filters: Filter<Readonly, TypeT>[]
  ): StrictlyTypedQueryBuilder<Readonly, TypeT> {
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
  ): StrictlyTypedQueryBuilder<Readonly, TypeT>;
  valued(
    prop: string,
    valOrPred: ValuePred,
  ): StrictlyTypedQueryBuilder<Readonly, TypeT>;
  valued(
    prop: string,
    valOrPred: ValuePred,
  ): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    return this.filter((e) => {
      const v = e.state.variables[prop];
      if (typeof valOrPred === "function") {
        return valOrPred(v);
      } else {
        return v === valOrPred;
      }
    });
  }

  byId(id: number): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    return this.filter((e) => e.state.id === id);
  }
  self(): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    return this.byId(this.callerWho);
  }

  orderBy(
    fn: OrderFn<Readonly, TypeT>,
  ): StrictlyTypedQueryBuilder<Readonly, TypeT> {
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
      const activeIdx = player.characters.findIndex(
        (ch) => ch.id === player.activeCharacterId,
      );
      if (activeIdx === -1) {
        throw new Error("Invalid active character index");
      }
      for (let i = 0; i < player.characters.length; i++) {
        const idx = (activeIdx + i) % player.characters.length;
        const ch = player.characters[idx];
        if (!this._includeDefeated && ch.defeated) {
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

  includeDefeated(): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    this._includeDefeated = true;
    return this;
  }

  energyNotFull() {
    return this.filter((e) => e instanceof CharacterContext && e.fullEnergy());
  }

  position(pos: CharacterPosition): StrictlyTypedQueryBuilder<Readonly, TypeT> {
    return this.filter(
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

  recentOpp(): StrictlyTypedQueryBuilder<Readonly, "character"> {
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
    return new QueryBuilder(this.skillContext, this.callerWho)
      .character()
      .filter((e) => e.who === flip(targetCh.who))
      .orderBy(orderFn);
  }

  into(): StrictlyTypedQueryBuilder<Readonly, "status"> {
    const targetCh = this.one();
    if (!(targetCh instanceof CharacterContext)) {
      throw new Error("into() expected a character here");
    }
    return new QueryBuilder<Readonly, "status">(
      this.skillContext,
      this.callerWho,
    ).filter((e) => {
      if (!(e instanceof EntityContext)) {
        return false;
      }
      return e.master().id === targetCh.id;
    });
  }

  // STATUS ONLY

  shield(): StrictlyTypedQueryBuilder<Readonly, "status"> {
    const self = this as unknown as QueryBuilder<Readonly, "status">;
    return self.tagged("shield");
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
  TypeT extends ExEntityType,
> = Omit<QueryBuilder<Readonly, TypeT>, QueryBuilderOmitProp[TypeT]>;

export type TargetQueryArg<Readonly extends boolean> =
  | StrictlyTypedCharacterContext<Readonly>[]
  | StrictlyTypedCharacterContext<Readonly>
  | ((
      $: StrictlyTypedQueryBuilder<Readonly, "character">,
    ) =>
      | StrictlyTypedQueryBuilder<Readonly, "character">
      | StrictlyTypedCharacterContext<Readonly>[]
      | StrictlyTypedCharacterContext<Readonly>);
