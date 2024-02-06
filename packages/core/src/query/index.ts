import { ContextMetaBase, SkillContext } from "../builder/context";
import { TypedExEntity } from "../builder/type";
import { GuessedTypeOfQuery } from "./types";
import { QueryArgs, doSemanticQueryAction } from "./semantic";
import { allEntities, getEntityArea } from "../util";
import { CharacterState, EntityState, GameState } from "../base/state";
import {
  ActionEventArg,
  DamageEventArg,
  DamageInfo,
  SwitchActiveEventArg,
  UseSkillInfo,
} from "../base/skill";
import { CardSkillEventArg } from "../base/card";
import { GiTcgDataError } from "../error";

export function executeQuery<
  Meta extends ContextMetaBase,
  const Q extends string,
>(
  ctx: SkillContext<Meta>,
  q: Q,
): TypedExEntity<Meta, GuessedTypeOfQuery<Q>>[] {
  const targetLength = (ctx.eventArg as any)?.targets?.length ?? 0;
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
          throw new GiTcgDataError(`This caller do not have @master`);
        }
        return area.characterId;
      },
      event: {
        skillCaller: () =>
          (ctx.eventArg as ActionEventArg<UseSkillInfo>).action.skill.caller.id,
        switchTo: () => (ctx.eventArg as SwitchActiveEventArg).switchInfo.to.id,
      },
      damage: {
        target: () =>
          (ctx.eventArg as DamageEventArg<DamageInfo>).damageInfo.target.id,
      },
      targets: Object.fromEntries(
        new Array(targetLength)
          .fill(0)
          .map((_, i) => [
            `${i}`,
            () => (ctx.eventArg as CardSkillEventArg).targets[i].id,
          ]),
      ),
    },
  };
  const result = doSemanticQueryAction(q, arg);
  return result.map((st) => ctx.of(st));
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
