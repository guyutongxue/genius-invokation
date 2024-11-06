// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { produce } from "immer";
import { applyMutation, Mutation } from "./base/mutation";
import {
  ActionEventArg,
  ActionInfo,
  DisposeOrTuneCardEventArg,
  EventAndRequest,
  GenericModifyActionEventArg,
  PlayCardEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  UseSkillEventArg,
} from "./base/skill";
import { GameState } from "./base/state";
import { GeneralSkillArg, SkillExecutor } from "./skill_executor";
import { getActiveCharacterIndex, getEntityArea } from "./utils";
import { GiTcgPreviewAbortedError, StateMutator } from "./mutator";
import { ExposedMutation, PreviewData } from "@gi-tcg/typings";
import { exposeEntity, exposeState } from "./io";

export type ActionInfoWithModification = ActionInfo & {
  eventArg: InstanceType<typeof GenericModifyActionEventArg>;
};

class PreviewContext {
  private mutator: StateMutator;
  private stateMutations: Mutation[] = [];
  private exposedMutations: ExposedMutation[] = [];
  public stopped = false;
  constructor(private readonly initialState: GameState) {
    this.mutator = new StateMutator(initialState, {
      onNotify: ({ stateMutations, exposedMutations }) => {
        this.stateMutations.push(...stateMutations);
        this.exposedMutations.push(...exposedMutations);
      },
      onPause: async () => {},
    });
  }

  get state() {
    return this.mutator.state;
  }

  mutate(mutation: Mutation) {
    this.mutator.mutate(mutation);
  }

  async previewSkill(skillInfo: SkillInfo, arg: GeneralSkillArg) {
    if (this.stopped) {
      return;
    }
    const executor = new SkillExecutor(this.mutator, { preview: true });
    try {
      await executor.finalizeSkill(skillInfo, arg);
    } catch (e) {
      if (e instanceof GiTcgPreviewAbortedError) {
        this.stopped = true;
      } else {
        throw e;
      }
    }
  }
  async previewEvent(...event: EventAndRequest) {
    if (this.stopped) {
      return;
    }
    const executor = new SkillExecutor(this.mutator, { preview: true });
    try {
      await executor.handleEvent(event);
    } catch (e) {
      if (e instanceof GiTcgPreviewAbortedError) {
        this.stopped = true;
      } else {
        throw e;
      }
    }
  }

  getPreviewData(): PreviewData[] {
    const result: PreviewData[] = [];
    for (const em of this.exposedMutations) {
      switch (em.type) {
        case "elementalReaction": {
          result.push({
            type: "reaction",
            character: em.on,
            value: em.reactionType,
          });
          break;
        }
      }
    }
    const newHealths = new Map<number, number>();
    const newEnergies = new Map<number, number>();
    const newAura = new Map<number, number>();
    const newAlive = new Map<number, number>();
    const newVisibleVar = new Map<number, number>();
    for (const m of this.stateMutations) {
      switch (m.type) {
        case "switchActive": {
          result.push({
            type: "newActive",
            character: m.value.id,
          });
          break;
        }
        case "modifyEntityVar": {
          const type = m.state.definition.type;
          if (type === "character") {
            const maps = {
              health: newHealths,
              energy: newEnergies,
              aura: newAura,
              alive: newAlive,
            };
            if (m.varName in maps) {
              maps[m.varName as keyof typeof maps].set(m.state.id, m.value);
            }
          } else {
            if (m.varName === m.state.definition.visibleVarName) {
              newVisibleVar.set(m.state.id, m.value);
            }
          }
          break;
        }
        case "createEntity": {
          let where: "summons" | "supports";
          if (m.where.type === "summons" || m.where.type === "supports") {
            where = m.where.type;
          } else {
            break;
          }
          result.push({
            type: "newEntity",
            who: m.where.who,
            where,
            state: exposeEntity(this.state, m.value),
          });
          break;
        }
        case "removeEntity": {
          result.push({
            type: "disposedEntity",
            entity: m.oldState.id,
          });
          break;
        }
      }
    }
    for (const [id, value] of newHealths) {
      result.push({
        type: "newHealth",
        character: id,
        value,
      });
    }
    for (const [id, value] of newEnergies) {
      result.push({
        type: "newEnergy",
        character: id,
        value,
      });
    }
    for (const [id, value] of newAura) {
      result.push({
        type: "newAura",
        character: id,
        value,
      });
    }
    for (const [id, value] of newAlive) {
      if (value === 0) {
        result.push({
          type: "defeated",
          character: id,
        });
      }
    }
    for (const [id, value] of newVisibleVar) {
      result.push({
        type: "entityVarDiff",
        entity: id,
        newValue: value,
      });
    }
    return result;
  }
}

/**
 * 对 actionInfo 应用 modifyAction，并附属预览状态
 */
export class ActionPreviewer {
  constructor(
    private readonly originalState: GameState,
    private readonly who: 0 | 1,
  ) {}

  async modifyAndPreview(
    actionInfo: ActionInfo,
  ): Promise<ActionInfoWithModification> {
    // eventArg_PreCalc 为预计算，只应用 ActionInfo 的副作用
    // eventArg_Real 行动后使用，然后传入 handleEvent 使其真正发生
    const eventArgPreCalc = new GenericModifyActionEventArg(
      this.originalState,
      actionInfo,
    );
    const eventArgReal = new GenericModifyActionEventArg(
      this.originalState,
      actionInfo,
    );
    const ctx = new PreviewContext(this.originalState);
    await ctx.previewEvent("modifyAction0", eventArgPreCalc);
    await ctx.previewEvent("modifyAction1", eventArgPreCalc);
    await ctx.previewEvent("modifyAction2", eventArgPreCalc);
    await ctx.previewEvent("modifyAction3", eventArgPreCalc);
    const newActionInfo = eventArgPreCalc.action;

    const player = () => ctx.state.players[this.who];
    const activeCh = () =>
      player().characters[getActiveCharacterIndex(player())];
    switch (newActionInfo.type) {
      case "useSkill": {
        const skillInfo = newActionInfo.skill;
        const callerArea = getEntityArea(ctx.state, activeCh().id);
        await ctx.previewEvent(
          "onBeforeUseSkill",
          new UseSkillEventArg(ctx.state, callerArea, newActionInfo.skill),
        );
        await ctx.previewSkill(skillInfo, { targets: newActionInfo.targets });
        await ctx.previewEvent(
          "onUseSkill",
          new UseSkillEventArg(ctx.state, callerArea, newActionInfo.skill),
        );
        break;
      }
      case "playCard": {
        const card = newActionInfo.skill.caller;
        if (card.definition.tags.includes("legend")) {
          ctx.mutate({
            type: "setPlayerFlag",
            who: this.who,
            flagName: "legendUsed",
            value: true,
          });
        }
        await ctx.previewEvent(
          "onBeforePlayCard",
          new PlayCardEventArg(ctx.state, newActionInfo),
        );
        if (
          player().combatStatuses.find((st) =>
            st.definition.tags.includes("disableEvent"),
          ) &&
          card.definition.cardType === "event"
        ) {
          ctx.mutate({
            type: "removeCard",
            who: this.who,
            where: "hands",
            oldState: card,
            reason: "disabled",
          });
        } else {
          ctx.mutate({
            type: "removeCard",
            who: this.who,
            where: "hands",
            oldState: card,
            reason: "play",
          });
          const arg = { targets: newActionInfo.targets };
          await ctx.previewSkill(newActionInfo.skill, arg);
          await ctx.previewEvent(
            "onPlayCard",
            new PlayCardEventArg(ctx.state, newActionInfo),
          );
        }
        break;
      }
      case "switchActive": {
        ctx.mutate({
          type: "switchActive",
          who: this.who,
          value: newActionInfo.to,
        });
        await ctx.previewEvent(
          "onSwitchActive",
          new SwitchActiveEventArg(ctx.state, newActionInfo),
        );
        break;
      }
      case "elementalTuning": {
        const card = newActionInfo.card;
        const tuneCardEventArg = new DisposeOrTuneCardEventArg(
          ctx.state,
          card,
          "elementalTuning",
        );
        ctx.mutate({
          type: "removeCard",
          who: this.who,
          where: "hands",
          oldState: card,
          reason: "elementalTuning",
        });
        await ctx.previewEvent("onDisposeOrTuneCard", tuneCardEventArg);
        break;
      }
      case "declareEnd": {
        ctx.mutate({
          type: "setPlayerFlag",
          who: this.who,
          flagName: "declaredEnd",
          value: true,
        });
        break;
      }
    }
    await ctx.previewEvent(
      "onAction",
      new ActionEventArg(ctx.state, newActionInfo),
    );
    return {
      ...newActionInfo,
      eventArg: eventArgReal,
      preview: ctx.getPreviewData(),
    };
  }
}
