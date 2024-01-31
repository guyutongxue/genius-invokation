import { SkillContext } from "../builder/context";
import { ExContextType, ExEntityType } from "../builder/type";
import { GuessedTypeOfQuery } from "./types";
import { QueryArgs, doSemanticQueryAction } from "./semantic";
import { allEntities, getEntityArea, getEntityById } from "../util";
import { CharacterState, EntityState, GameState } from "..";

type AnyExt = { [prop: string]: any };

export function executeQuery<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  const Q extends string,
>(
  ctx: SkillContext<Readonly, Ext, CallerType>,
  s: Q,
): ExContextType<Readonly, GuessedTypeOfQuery<Q>>[];
export function executeQuery(
  ctx: SkillContext<boolean, object, ExEntityType> & AnyExt,
  q: string,
) {
  const targetLength = ctx?.targets?.length ?? 0;
  const arg: QueryArgs = {
    get state() {
      return ctx.state;
    },
    get callerWho() {
      return ctx.callerArea.who;
    },
    candidates: allEntities(ctx.state),
    externals: {
      self: () => ctx.skillInfo.caller.id,
      master: () => {
        const callerId = ctx.skillInfo.caller.id;
        const area = getEntityArea(ctx.state, callerId);
        if (area.type !== "characters") {
          throw new Error(`This caller do not have @master`);
        }
        return area.characterId;
      },
      event: {
        skillCaller: () => ctx.eventArg.caller.id,
      },
      damage: {
        target: () => ctx.damageInfo.target.id,
      },
      targets: Object.fromEntries(
        new Array(targetLength)
          .fill(0)
          .map((_, i) => [`${i}`, () => ctx.targets[i].id]),
      ),
    },
  };
  const result = doSemanticQueryAction(q, arg);
  return result.map((st) => ctx.of(st)) as any;
}

export function executeQueryOnState(
  state: GameState,
  who: 0 | 1,
  q: string,
): (EntityState | CharacterState)[] {
  return doSemanticQueryAction(q, {
    state,
    candidates: allEntities(state),
    callerWho: who,
    externals: {},
  });
}
