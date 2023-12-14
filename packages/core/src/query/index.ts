import { SkillContext } from "../builder/context";
import { ExContextType, ExEntityType } from "../builder/type";
import { GuessedTypeOfQuery } from "./types";
import { QueryArgs, doSemanticQueryAction } from "./semantic";
import { allEntities } from "../util";

export function executeQuery<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  const Q extends string,
>(
  ctx: SkillContext<Readonly, Ext, CallerType>,
  s: Q,
): ExContextType<Readonly, GuessedTypeOfQuery<Q>>[] {
  const arg: QueryArgs = {
    skillContext: ctx as any,
    get state() {
      return ctx.state;
    },
    get callerArea() {
      return ctx.callerArea;
    },
    candidates: allEntities(ctx.state),
    externals: {
      self: (c) => c.skillInfo.caller,
      event: {
        skillCaller: (c) => c.eventArg.skillInfo.caller,
      },
      targets: (((ctx as any)?.targets as any[]) ?? []).map(
        (e) => () => e,
      ) as any,
    },
  };
  const result = doSemanticQueryAction(s, arg);
  return result.map((st) => ctx.of(st)) as any;
}
