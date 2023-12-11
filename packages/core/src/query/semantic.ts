import grammar, { QueryLangActionDict } from "./query.ohm-bundle";
import { CharacterState, EntityState, GameState } from "../base/state";

type CallerState = EntityState | CharacterState;

interface SemanticArgs {
  candidates: number[];
  state: GameState;
  caller: CallerState;
  externals: 
}

declare module "ohm-js" {
  interface Node {
    args: {
      ctx: SemanticArgs;
    };
    doQuery(ctx: SemanticArgs): number[];
  }
}

const semantics = grammar.createSemantics();

const doQueryDict: QueryLangActionDict<number[]> = {
  Query(orQuery, orderBy, limit) {
    return orQuery.doQuery(this.args.ctx);
  },
  OrQuery(andQuery) {
    console.log("and Query");
    return andQuery.doQuery(this.args.ctx);
  },
  OrQuery_or(orQuery, _, andQuery) {},
  RelationalQuery(unaryQuery) {
    return unaryQuery.doQuery(this.args.ctx);
  },
  RelationalQuery_has(relationalQuery, _, unaryQuery) {},
  RelationalQuery_at(relationalQuery, _, unaryQuery) {},
  UnaryQuery(primaryQuery) {
    return primaryQuery.doQuery(this.args.ctx);
  },
  UnaryQuery_not(_, unaryQuery) {},
  UnaryQuery_recentFrom(_, unaryQuery) {},
  PrimaryQuery_canonical(who, type, with_) {},
  PrimaryQuery_external(_, props) {},
  PrimaryQuery_paren(_l, query, _r) {
    return query.doQuery(this.args.ctx);
  },
};

semantics.addOperation("doQuery(ctx)", doQueryDict);

semantics(
  grammar.match("my characters with tag weapon of (opp active character)"),
).doQuery({ hello: 1 });
