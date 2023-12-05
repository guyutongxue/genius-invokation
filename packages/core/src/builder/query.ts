import { AST, GuessedTypeOfQuery, toAst } from "@gi-tcg/query-parser";

import {
  CharacterContext,
  EntityContext,
  SkillContext,
  StrictlyTypedCharacterContext,
} from "./context";
import { ExContextType, ExEntityType } from "./type";
import { CharacterState, EntityState } from "../base/state";
import { getEntityArea } from "../util";
import { flip } from "@gi-tcg/utils";

const getter: AST.StateGetter = {
  id: `$.id`,
  definitionId: `$.definition.id`,
  tags: `$.definition.tags`,
  getConstant(name) {
    return `$.definition.constant[${JSON.stringify(name)}]`;
  },
  getVariableOrConstant(name) {
    const quoted = JSON.stringify(name);
    return `($.variables[${quoted}] ?? $.definition.constant[${quoted}])`;
  },
};

type Filter = (
  ctx: SkillContext<false, {}, any>,
  st: CharacterState | EntityState,
) => boolean;

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
    } else {
      const subjectFilter = queryToFilter(node.subject);
      const objectFilter = queryToFilter(node.object);
      if (node.subtype === "at") {
        return (ctx, st) => {
          if (!subjectFilter(ctx, st)) return false;
          const objects = doFilter(ctx, objectFilter);
          const area = getEntityArea(ctx.state, st.id);
          if (
            area.type === "characters" &&
            objects.map((c) => c.state.id).includes(area.characterId)
          ) {
            return true;
          }
          return false;
        };
      } else {
        return (ctx, st) => {
          if (!subjectFilter(ctx, st)) return false;
          if (st.definition.type !== "character") return false;
          const objects = doFilter(ctx, objectFilter);
          for (const obj of objects) {
            if (obj.state.definition.type === "character") continue;
            const area = getEntityArea(ctx.state, obj.state.id);
            if (area.type == "characters" && area.characterId === st.id) {
              return true;
            }
          }
          return false;
        };
      }
    }
  }
  if (node.type === "prefix") {
    const prefixes = [...node.prefixes];
    if (node.prefixes.length === 0) {
      return queryToFilter(node.target);
    }
    const first = prefixes.shift()!;
    if (first === "not") {
      const filter = queryToFilter({
        ...node,
        prefixes,
      });
      return (...args) => {
        return !filter(...args);
      };
    } else {
      // recent opp TODO
      return () => false;
    }
  }
  if (node.subtype === "paren") {
    return queryToFilter(node.query);
  }
  const filter: Filter = (ctx, st) => {
    if (node.entityType === "any") return true;
    const { who } = getEntityArea(ctx.state, st.id);
    const sameType = st.definition.type === node.entityType;
    const sameWho =
      node.who === "all" ||
      who ===
        (node.who === "opp" ? flip(ctx.callerArea.who) : ctx.callerArea.who);
    const defeatedOk =
      st.definition.type !== "character" ||
      node.defeated === "includes" ||
      !(node.defeated === "only" ? st.variables.alive : !st.variables.alive);
    let positionOk = node.position === null;
    if (node.position === "active") {
      positionOk = ctx.state.players[who].activeCharacterId === st.id;
    }
    node.position;
    return sameType && sameWho && defeatedOk && positionOk;
  };
  if (node.rule) {
    const how = node.rule.how;
    return (ctx, st) => filter(ctx, st) && how(st);
  } else {
    return filter;
  }
}

function doFilter(
  ctx: SkillContext<false, {}, any>,
  filter: Filter,
): ExContextType<false, any>[] {
  const cb = (st: EntityState | CharacterState) => filter(ctx as any, st);
  const result: ExContextType<false, any>[] = [];
  for (const player of ctx.state.players) {
    for (const ch of player.characters) {
      if (cb(ch)) {
        result.push(new CharacterContext(ctx, ch.id));
      }
      for (const entity of ch.entities) {
        if (cb(entity)) {
          result.push(new EntityContext(ctx, entity.id));
        }
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      const area = player[key];
      for (const entity of area) {
        if (cb(entity)) {
          result.push(new EntityContext(ctx, entity.id));
        }
      }
    }
  }
  return result;
}

export function executeQuery<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  const Q extends string,
>(
  ctx: SkillContext<Readonly, Ext, CallerType>,
  s: Q,
): ExContextType<Readonly, GuessedTypeOfQuery<Q>>[] {
  const ast = toAst(s, getter);
  console.log("ast: ", ast);
  const filter = queryToFilter(ast);
  return doFilter(ctx as any, filter) as any;
}
