export interface Query {
  type: "or";
  children: AndQuery[];
  orderBy: OrderBy[];
  limit: number;
}
export interface AndQuery {
  type: "and";
  children: RelationQuery[];
}
export type RelationQuery =
  | {
      type: "relation";
      subtype: "leaf";
      query: PrefixQuery;
    }
  | {
      type: "relation";
      subtype: "has" | "at";
      subject: PrefixQuery;
      object: RelationQuery;
    };

export interface PrefixQuery {
  type: "prefix";
  prefixes: ("recentOpp" | "not")[];
  target: AtomicQuery;
}

export type AtomicQuery =
  | {
    type: "external";
    identifiers: string[]
  }
  | {
      type: "atomic";
      subtype: "paren";
      query: Query;
    }
  | {
      type: "atomic";
      subtype: "atomic";
      who: Who;
      entityType: EntityType;
      position: Position | null;
      defeated: DefeatedOption;
      rule: Rule | null;
    };

export type DefeatedOption = "includes" | "only" | "no";
export type Who = "my" | "opp" | "all";
export type EntityType =
  | "character"
  | "summon"
  | "combatStatus"
  | "support"
  | "status"
  | "equipment"
  | "any";
export type Position = "active" | "next" | "prev" | "standby";

export interface Rule {
  type: "rule";
  how: WithRule;
}

export interface StateGetter {
  id: string;
  definitionId: string;
  tags: string;
  getVariableOrConstant(name: string): string;
  getConstant(name: string): string;
}

export type OrderBy = (state: any) => number;
export type WithRule = (state: any) => boolean;
