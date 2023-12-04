import { AST, GuessedTypeOfQuery, toAst } from "@gi-tcg/query-parser";

import { SkillContext, StrictlyTypedCharacterContext } from "./context";
import { ExContextType, ExEntityType } from "./type";
import { CharacterState, EntityState, GameState } from "..";


type Filter = (global: GameState, st: CharacterState | EntityState) => boolean;

export function queryToFilter(
  node:
    | AST.Query
    | AST.AndQuery
    | AST.RelationQuery
    | AST.PrefixQuery
    | AST.AtomicQuery,
): Filter {
  if (node.type === "or") {
    const filters = node.children.map(queryToFilter);
    return (...args) => {
      for (const f of filters) {
        if (f(...args)) return true;
      }
      return false;
    };
  }
  if (node.type === "and") {
    const filters = node.children.map(queryToFilter);
    return (...args) => {
      for (const f of filters) {
        if (!f(...args)) return false;
      }
      return true;
    };
  }
  if (node.type === "relation") {
    if (node.subtype === "leaf") {
      return queryToFilter(node.query);
    } else if (node.subtype === "at") {
      return;
    } else {
      return;
    }
  }
  if (node.type === "prefix") {
    const prefixes = [...node.prefixes];
    if (node.prefixes.length === 0) {
      return queryToFilter(node.target);
    }
    const first = prefixes.pop()!;
    if (first === "not") {
      const filter = queryToFilter({
        ...node,
        prefixes,
      });
      return (...args) => {
        return !filter(...args);
      };
    } else {
      // recent opp
      return;
    }
  }
  if (node.subtype === "paren") {
    return queryToFilter(node.query);
  }
  const filter: Filter = (global, st) => {
    const sameType = st.definition.type === node.entityType;
    const defeatedOk =
      st.definition.type === "character" &&
      (!!st.variables.alive || node.includesDefeated);

    return true;
  };
  if (node.rule) {
    if (node.rule.how.subtype === "expression") {
    } else if (node.rule.how.subtype === "id") {
    } else if (node.rule.how.subtype === "tag") {
    }
  } else {
    return filter;
  }
}

export function doQuery<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  const Q extends string,
>(
  ctx: SkillContext<Readonly, Ext, CallerType>,
  s: Q,
): ExContextType<Readonly, GuessedTypeOfQuery<Q>>[] {
  const ast = toAst(s);
  queryToFilter(ast)(ctx.state);
}
