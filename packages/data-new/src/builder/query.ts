import { flip } from "@gi-tcg/utils";
import { EntityTag } from "../entity";
import { ExEntityType, ExContextType, ExTag, HandleT } from "./type";
import {
  CharacterContext,
  CharacterPosition,
  EntityContext,
  SkillContext,
} from "./context";

type Filter<TypeT extends ExEntityType> = (e: ExContextType<TypeT>) => boolean;
type ValuePred = number | ((v: number) => boolean);
type OrderFn<TypeT extends ExEntityType> = (e: ExContextType<TypeT>) => number;

export class QueryBuilder<TypeT extends ExEntityType> {
  private _all = false;
  private _includeDefeated = false;
  private filters: Filter<TypeT>[] = [];
  private _orderFn: OrderFn<TypeT> | null = null;
  constructor(
    private readonly skillContext: SkillContext,
    private callerWho: 0 | 1,
  ) {}

  type<NewT extends ExEntityType>(type: NewT): QueryBuilder<NewT> {
    const self = this as unknown as QueryBuilder<NewT>;
    return self.filter((e) => e.state.definition.type === type);
  }
  character() {
    return this.type("character");
  }
  combat() {
    return this.type("combatStatus");
  }
  equipment() {
    return this.type("equipment");
  }
  summon() {
    return this.type("support");
  }
  support() {
    return this.type("support");
  }

  all() {
    this._all = true;
    return this;
  }

  opp() {
    this.callerWho = flip(this.callerWho);
    return this;
  }

  filter(...filters: Filter<TypeT>[]) {
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

  valued(prop: string, valOrPred: ValuePred) {
    return this.filter((e) => {
      const v = e.state.variables[prop];
      if (typeof valOrPred === "function") {
        return valOrPred(v);
      } else {
        return v === valOrPred;
      }
    });
  }

  byId(id: number) {
    return this.filter((e) => e.state.id === id);
  }

  orderBy(fn: OrderFn<TypeT>) {
    this._orderFn = fn;
    return this;
  }

  many(): ExContextType<TypeT>[] {
    const state = this.skillContext.state;
    const result: (CharacterContext | EntityContext)[] = [];
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
    const filtered = (result as ExContextType<TypeT>[]).filter((ctx) =>
      this.filters.every((f) => f(ctx)),
    );
    if (this._orderFn) {
      filtered.sort((a, b) => this._orderFn!(a) - this._orderFn!(b));
    }
    return filtered;
  }

  one(): ExContextType<TypeT> {
    const result = this.many();
    if (result.length === 0) {
      throw new Error("No entity found");
    }
    return result[0];
  }

  // CHARACTER ONLY

  includeDefeated() {
    this._includeDefeated = true;
    return this;
  }

  energyNotFull() {
    return this.filter((e) => e instanceof CharacterContext && e.fullEnergy());
  }

  position(pos: CharacterPosition) {
    return this.filter(
      (e) => e instanceof CharacterContext && e.satisfyPosition(pos),
    );
  }
  active() {
    return this.position("active");
  }

  recentOpp(): QueryBuilder<"character"> {
    const targetCh = this.one();
    if (!(targetCh instanceof CharacterContext)) {
      throw new Error("recentOpp() expected a character here");
    }
    const state = this.skillContext.state;
    const baseIdx = targetCh.positionIndex();
    const baseLen = state.players[targetCh.who].characters.length;
    const baseRatio = baseIdx - (baseLen / 2 - 0.5);
    const orderFn = (e: CharacterContext) => {
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

  into(): QueryBuilder<"status"> {
    const targetCh = this.one();
    if (!(targetCh instanceof CharacterContext)) {
      throw new Error("into() expected a character here");
    }
    return new QueryBuilder(this.skillContext, this.callerWho).filter((e) => {
      if (!(e instanceof EntityContext)) {
        return false;
      }
      return e.master().id === targetCh.id;
    });
  }

  // STATUS ONLY

  shield() {
    const self = this as QueryBuilder<"status">;
    return self.tagged("shield");
  }
}
