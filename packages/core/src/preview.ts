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
import { applyMutation } from "./base/mutation";
import {
  ActionEventArg,
  ActionInfo,
  DisposeOrTuneCardEventArg,
  ModifyAction3EventArg,
  PlayCardEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  UseSkillEventArg,
} from "./base/skill";
import { AnyState, GameState } from "./base/state";
import { SkillExecutor } from "./skill_executor";
import { Writable, allEntities, getActiveCharacterIndex } from "./utils";

export type ActionInfoWithModification = ActionInfo & {
  eventArg: ModifyAction3EventArg<ActionInfo>;
};

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
    const eventArgPreCalc = new ModifyAction3EventArg(this.originalState, actionInfo);
    const eventArgReal = new ModifyAction3EventArg(this.originalState, actionInfo);
    let [previewState, completed] = await SkillExecutor.previewEvent(
      this.originalState,
      "modifyAction0",
      eventArgPreCalc,
    );
    if (completed) {
      [previewState, completed] = await SkillExecutor.previewEvent(
        previewState,
        "modifyAction1",
        eventArgPreCalc,
      );
    }
    if (completed) {
      [previewState, completed] = await SkillExecutor.previewEvent(
        previewState,
        "modifyAction2",
        eventArgPreCalc,
      );
    }
    if (completed) {
      [previewState, completed] = await SkillExecutor.previewEvent(
        previewState,
        "modifyAction3",
        eventArgPreCalc,
      );
    }
    const newActionInfo = eventArgPreCalc.action;

    const player = () => previewState.players[this.who];
    const activeCh = () =>
      player().characters[getActiveCharacterIndex(player())];
    switch (newActionInfo.type) {
      case "useSkill": {
        const skillInfo = newActionInfo.skill;
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewEvent(
            previewState,
            "onBeforeUseSkill",
            new UseSkillEventArg(previewState, this.who, newActionInfo.skill),
          );
        }
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewSkill(
            previewState,
            skillInfo,
          );
        }
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewEvent(
            previewState,
            "onUseSkill",
            new UseSkillEventArg(previewState, this.who, newActionInfo.skill),
          );
        }
        break;
      }
      case "playCard": {
        const card = newActionInfo.card;
        if (card.definition.tags.includes("legend")) {
          previewState = applyMutation(previewState, {
            type: "setPlayerFlag",
            who: this.who,
            flagName: "legendUsed",
            value: true,
          });
        }
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewEvent(
            previewState,
            "onBeforePlayCard",
            new PlayCardEventArg(previewState, newActionInfo),
          );
        }
        if (
          player().combatStatuses.find((st) =>
            st.definition.tags.includes("disableEvent"),
          ) &&
          card.definition.type === "event"
        ) {
          break;
        }
        previewState = applyMutation(previewState, {
          type: "removeCard",
          who: this.who,
          where: "hands",
          oldState: card,
          used: true,
        });
        const skillInfo: SkillInfo = {
          caller: activeCh(),
          definition: card.definition.onPlay,
          fromCard: card,
          requestBy: null,
          charged: false,
          plunging: false,
        };
        const arg = { targets: newActionInfo.targets };
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewSkill(
            previewState,
            skillInfo,
            arg,
          );
        }
        break;
      }
      case "switchActive": {
        previewState = applyMutation(previewState, {
          type: "switchActive",
          who: this.who,
          value: newActionInfo.to,
        });
        if (completed) {
          [previewState, completed] = await SkillExecutor.previewEvent(
            previewState,
            "onSwitchActive",
            new SwitchActiveEventArg(previewState, newActionInfo),
          );
        }
        break;
      }
      case "elementalTuning": {
        const card = newActionInfo.card;
        previewState = applyMutation(previewState, {
          type: "removeCard",
          who: this.who,
          where: "hands",
          oldState: card,
          used: false,
        });
        if (completed) {
          const tuneCardEventArg = new DisposeOrTuneCardEventArg(
            previewState,
            this.who,
            card,
            "elementalTuning",
          );
          [previewState, completed] = await SkillExecutor.previewEvent(
            previewState,
            "onDisposeOrTuneCard",
            tuneCardEventArg,
          );
        }
        break;
      }
      case "declareEnd": {
        previewState = applyMutation(previewState, {
          type: "setPlayerFlag",
          who: this.who,
          flagName: "declaredEnd",
          value: true,
        });
      }
    }
    if (completed) {
      [previewState, completed] = await SkillExecutor.previewEvent(
        previewState,
        "onAction",
        new ActionEventArg(previewState, newActionInfo),
      );
    }
    console.log(newActionInfo);
    return {
      ...newActionInfo,
      eventArg: eventArgReal,
      preview: this.checkPreviewState(previewState),
    };
  }

  /** 检查预览的游戏对局是否存在泄露信息的情况 */
  private checkPreviewState(previewState: GameState): GameState | undefined {
    const currentRandomIt = this.originalState.iterators.random;
    const previewRandomIt = previewState.iterators.random;
    const randomStepped = currentRandomIt !== previewRandomIt;
    const currentEntities = allEntities(this.originalState);
    return produce(previewState, (draft) => {
      for (const who of [0, 1] as const) {
        const previewPlayer = draft.players[who];
        const currentPlayer = this.originalState.players[who];

        // 隐藏当前还在牌库中的手牌，或者步进了随机数生成器后新的手牌
        const currentPileCards = currentPlayer.piles.map((c) => c.id);
        const currentHandCards = currentPlayer.hands.map((c) => c.id);
        for (const card of previewPlayer.hands) {
          if (
            currentPileCards.includes(card.id) ||
            (randomStepped && !currentHandCards.includes(card.id))
          ) {
            card.id = 0;
          }
        }
      }
      // 若步进了随机数生成器，则隐藏新建实体
      if (randomStepped) {
        const previewEntities = allEntities(draft) as Writable<AnyState>[];
        for (const entity of previewEntities) {
          if (!currentEntities.find((et) => et.id === entity.id)) {
            entity.id = 0;
          }
        }
      }
      return draft;
    });
  }
}
