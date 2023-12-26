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
  const targetLength = (ctx as any)?.targets?.length ?? 0;
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
      self: (c) => c.skillInfo.caller.id,
      master: (c) => {
        const callerId = c.skillInfo.caller.id;
        const area = getEntityArea(c.state, callerId);
        if (area.type !== "characters") {
          throw new Error(`This caller do not have @master`);
        }
        return area.characterId;
      },
      event: {
        skillCaller: (c) => c.eventArg.caller.id,
      },
      damage: {
        target: (c) => c.damageInfo.target.id,
      },
      targets: Object.fromEntries(
        new Array(targetLength)
          .fill(0)
          .map((_, i) => [`${i}`, (c) => c.targets[i].id]),
      ),
    },
  };
  const result = doSemanticQueryAction(s, arg);
  return result.map((st) => ctx.of(st)) as any;
}
