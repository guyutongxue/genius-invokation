export interface Query {
  type: "or";
  children: AndQuery[];
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
      includesDefeated: boolean;
      rule: Rule | null;
    };

export type Who = "my" | "opp" | "all";
export type EntityType =
  | "character"
  | "summon"
  | "combatStatus"
  | "support"
  | "status"
  | "equipment";
export type Position = "active" | "next" | "prev" | "standby";

export interface Rule {
  type: "rule";
  negative: boolean;
  how: RuleDetail;
}

export type RuleDetail =
  | {
      type: "ruleDetail";
      subtype: "id";
      id: number;
    }
  | {
      type: "ruleDetail";
      subtype: "tag";
      tags: string[];
    }
  | {
      type: "ruleDetail";
      subtype: "expression";
      lhs: Variable;
      operator: Operator;
      rhs: Variable;
    };

export type Variable =
  | {
      type: "variable";
      subtype: "variable" | "constant";
      value: string;
    }
  | {
      type: "variable";
      subtype: "number";
      value: number;
    };

export type Operator = "<" | "<=" | "=" | ">=" | ">" | "!=";
