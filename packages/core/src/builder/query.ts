import { AST, GuessedTypeOfQuery, toAst } from "@gi-tcg/query-parser";

import {
  CharacterContext,
  EntityContext,
  ExtendedSkillContext,
  SkillContext,
  StrictlyTypedCharacterContext,
} from "./context";
import { ExContextType, ExEntityType } from "./type";
import { CharacterState, EntityState } from "../base/state";
import { getActiveCharacterIndex, getEntityArea, shiftLeft } from "../util";
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

type Filter = (st: CharacterState | EntityState) => boolean;

type Iota = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
type Dec<N extends number> = Iota[N];
type AtomicExternalQuery = (
  c: ExtendedSkillContext<boolean, Record<string, any>, any>,
) => CharacterState | EntityState;
type ExternalQueryDictionary<N extends number = 3> = N extends 0
  ? AtomicExternalQuery
  : Record<string, ExternalQueryDictionary<Dec<N>> | AtomicExternalQuery>;

const externalQueries: ExternalQueryDictionary = {
  self: (c) => c.skillInfo.caller,
  event: {
    skillCaller: (c) => c.eventArg.skillInfo.caller,
  },
  target0: (c) => c.targets[0],
  target1: (c) => c.targets[1]
};

export function queryToFilter(
  ctx: SkillContext<false, {}, any>,
  node:
    | AST.Query
    | AST.AndQuery
    | AST.RelationQuery
    | AST.PrefixQuery
    | AST.AtomicQuery,
): Filter {
  if (node.type === "or") {
    const filters = node.children.map((n) => queryToFilter(ctx, n));
    return (...args) => {
      for (const f of filters) {
        if (f(...args)) return true;
      }
      return false;
    };
  } else if (node.type === "and") {
    const filters = node.children.map((n) => queryToFilter(ctx, n));
    return (st) => {
      for (const f of filters) {
        if (!f(st)) return false;
      }
      return true;
    };
  } else if (node.type === "relation") {
    if (node.subtype === "leaf") {
      return queryToFilter(ctx, node.query);
    } else {
      const subjectFilter = queryToFilter(ctx, node.subject);
      const objectFilter = queryToFilter(ctx, node.object);
      const objects = doFilter(ctx, objectFilter);
      if (node.subtype === "at") {
        return (st) => {
          if (!subjectFilter(st)) return false;
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
        return (st) => {
          if (!subjectFilter(st)) return false;
          if (st.definition.type !== "character") return false;
          for (const obj of objects) {
            if (obj.state.definition.type === "character") continue;
            const area = obj.area;
            if (area.type == "characters" && area.characterId === st.id) {
              return true;
            }
          }
          return false;
        };
      }
    }
  } else if (node.type === "prefix") {
    const prefixes = [...node.prefixes];
    if (node.prefixes.length === 0) {
      return queryToFilter(ctx, node.target);
    }
    const first = prefixes.shift()!;
    if (first === "not") {
      const filter = queryToFilter(ctx, {
        ...node,
        prefixes,
      });
      return (...args) => {
        return !filter(...args);
      };
    } else {
      const state = ctx.state;
      const baseChFilter = queryToFilter(ctx, node.target);
      const baseChs = doFilter(ctx, baseChFilter);
      const recentChs: number[] = [];
      for (const baseCh of baseChs) {
        if (!(baseCh instanceof CharacterContext)) {
          continue;
        }
        const baseIdx = baseCh.positionIndex();
        const baseLen = state.players[baseCh.who].characters.length;
        const baseRatio = baseIdx - (baseLen / 2 - 0.5);
        const targetWho = flip(baseCh.who);
        const targetLen = state.players[targetWho].characters.length;
        const targetActiveIndex = getActiveCharacterIndex(
          state.players[targetWho],
        );
        const targetChs = state.players[targetWho].characters.map((ch, i) => ({
          ...ch,
          index: i,
        }));
        const shiftedTargetChs = shiftLeft(targetChs, targetActiveIndex);
        const orderFn = (ch: CharacterState & { index: number }) => {
          if (!ch.variables.alive) {
            return Infinity;
          }
          const ratio = ch.index - (targetLen / 2 - 0.5);
          return Math.abs(ratio - baseRatio);
        };
        shiftedTargetChs.sort((a, b) => orderFn(a) - orderFn(b));
        recentChs.push(shiftedTargetChs[0].id);
      }
      return (st) => {
        return recentChs.includes(st.id);
      };
    }
  } else if (node.type === "external") {
    const keys = [...node.identifiers];
    let dict: any = externalQueries;
    while (keys.length > 0) {
      const key = keys.shift()!;
      if (typeof dict === "function") {
        throw new Error(`external query "@${node.identifiers.join(".")}" not found`);
      }
      dict = dict[key];
      if (typeof dict === "undefined") {
        throw new Error(`external query "@${node.identifiers.join(".")}" not found`);
      }
    }
    const targetId = (dict as AtomicExternalQuery)(ctx).id;
    return (st) => st.id === targetId;
  } else if (node.subtype === "paren") {
    return queryToFilter(ctx, node.query);
  }
  const filter: Filter = (st) => {
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
    if (!(sameType && sameWho && defeatedOk)) return false;
    if (st.definition.type !== "character") return true;
    const chCtx = new CharacterContext(ctx, st.id);
    const positionOk =
      node.position === null || chCtx.satisfyPosition(node.position);
    return positionOk;
  };
  if (node.rule) {
    const how = node.rule.how;
    return (st) => filter(st) && how(st);
  } else {
    return filter;
  }
}

function doFilter(
  ctx: SkillContext<false, {}, any>,
  filter: Filter,
): ExContextType<false, any>[] {
  const result: ExContextType<false, any>[] = [];
  for (const player of ctx.state.players) {
    const activeIndex = getActiveCharacterIndex(player);
    const characters = shiftLeft(player.characters, activeIndex);
    for (const ch of characters) {
      if (filter(ch)) {
        result.push(new CharacterContext(ctx, ch.id));
      }
      for (const entity of ch.entities) {
        if (filter(entity)) {
          result.push(new EntityContext(ctx, entity.id));
        }
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      const area = player[key];
      for (const entity of area) {
        if (filter(entity)) {
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
  // console.log("ast: ", ast);
  const filter = queryToFilter(ctx as any, ast);
  return doFilter(ctx as any, filter).toSpliced(ast.limit) as any;
}
