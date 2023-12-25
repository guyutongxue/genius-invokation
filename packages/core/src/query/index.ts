import { SkillContext } from "../builder/context";
import { ExContextType, ExEntityType } from "../builder/type";
import { GuessedTypeOfQuery } from "./types";
import { QueryArgs, doSemanticQueryAction } from "./semantic";
import { allEntities, getEntityArea, getEntityById } from "../util";

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
      master: (c) => {
        const e = c.skillInfo.caller;
        const area = getEntityArea(c.state, e.id);
        if (area.type !== "characters") {
          throw new Error(`This caller do not have @master`);
        }
        return getEntityById(c.state, area.characterId);
      },
      event: {
        skillCaller: (c) => c.eventArg.caller,
      },
      damage: {
        target: (c) => c.damageInfo.target,
      },
      targets: (((ctx as any)?.targets as any[]) ?? []).map(
        (e) => () => e,
      ) as any,
    },
  };
  const result = doSemanticQueryAction(s, arg);
  return result.map((st) => ctx.of(st)) as any;
}
