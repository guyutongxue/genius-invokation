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

import { CardSkillEventArg } from "./base/card";
import {
  DamageInfo,
  DamageOrHealEventArg,
  EventAndRequest,
  EventArg,
  HealInfo,
  SkillInfo,
  ZeroHealthEventArg,
} from "./base/skill";
import { AnyState, GameState } from "./base/state";
import { Event } from "@gi-tcg/typings";
import { allEntities, checkImmune, getEntityArea, getEntityById } from "./util";
import { GiTcgCoreInternalError, GiTcgDataError } from "./error";

interface IoDuringSkillFinalize {
  switchCard(who: 0 | 1): Promise<void>;
  reroll(who: 0 | 1, times: number): Promise<void>;
  notifyAndPause(events: readonly Event[]): Promise<void>;
}

class GiTcgIoNotProvideError extends GiTcgCoreInternalError {
  constructor() {
    super("IO is not provided. This error should be catched.");
  }
}

export class SkillExecutor {
  constructor(
    private state: GameState,
    private readonly _io?: IoDuringSkillFinalize,
  ) {}

  private get io() {
    if (!this._io) {
      throw new GiTcgIoNotProvideError();
    }
    return this._io;
  }

  async finalizeSkill(
    skillInfo: SkillInfo,
    arg: EventArg | CardSkillEventArg | void,
  ): Promise<void> {
    const callerArea = getEntityArea(this.state, skillInfo.caller.id);
    let filteringState = this.state;
    if (arg instanceof EventArg) {
      arg._currentSkillInfo = skillInfo;
      // 在 arg.state 上做检查，即引发事件的时刻的全局状态，而非现在时刻的状态
      filteringState = arg._state;
    }
    // If skill has a filter and not passed, do nothing
    const skillDef = skillInfo.definition;
    if (
      "filter" in skillDef &&
      !(0, skillDef.filter)(filteringState, skillInfo, arg as any)
    ) {
      return;
    }
    const [newState, eventList] = (0, skillDef.action)(
      this.state,
      skillInfo,
      arg as any,
    );
    this.state = newState;

    const notifyEvents: Event[] = [];
    if (!skillInfo.fromCard) {
      notifyEvents.push({
        type: "triggered",
        id: skillInfo.caller.id,
      });
      if (skillDef.triggerOn === null) {
        notifyEvents.push({
          type: "useCommonSkill",
          who: callerArea.who,
          skill: skillDef.id,
        });
      }
    }

    const damageEvents = eventList.filter(
      (e): e is ["onDamageOrHeal", DamageOrHealEventArg<DamageInfo>] =>
        e[0] === "onDamageOrHeal",
    );
    const nonDamageEvents = eventList.filter((e) => e[0] !== "onDamageOrHeal");

    for (const [, arg] of damageEvents) {
      notifyEvents.push({
        type: "damage",
        damage: {
          type: arg.type,
          value: arg.value,
          target: arg.target.id,
          log: arg.log(),
        },
      });
    }
    for (const [eventName, arg] of nonDamageEvents) {
      if (eventName === "onReaction") {
        notifyEvents.push({
          type: "elementalReaction",
          on: arg.reactionInfo.target.id,
          reactionType: arg.reactionInfo.type,
        });
      }
    }

    await this.io.notifyAndPause(notifyEvents);

    const damageEventArgs: DamageOrHealEventArg<DamageInfo | HealInfo>[] = [];
    const zeroHealthEventArgs: ZeroHealthEventArg[] = [];
    for (const [, arg] of damageEvents) {
      if (arg.damageInfo.causeDefeated) {
        const zeroHealthEventArg = new ZeroHealthEventArg(
          this.state,
          arg.damageInfo,
        );
        if (checkImmune(this.state, zeroHealthEventArg)) {
          zeroHealthEventArgs.push(zeroHealthEventArg);
        }
        damageEventArgs.push(zeroHealthEventArg);
      } else {
        damageEventArgs.push(arg);
      }
    }
  }
  async handleEvents(actions: EventAndRequest[]) {
    for (const [name, arg] of actions) {
      if (name === "requestReroll") {
        await this.io.reroll(arg.who, arg.times);
      } else if (name === "requestSwitchHands") {
        await this.io.switchCard(arg.who);
      } else if (name === "requestUseSkill") {
        const def = this.state.data.skills.get(arg.requestingSkillId);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(
            `Unknown skill id ${arg.requestingSkillId} (requested by ${arg.caller.id} (defId = ${arg.caller.definition.id}))`,
          );
        }
        const player = this.state.players[arg.who];
        const skillInfo: SkillInfo = {
          caller: arg.caller,
          definition: def,
          fromCard: null,
          requestBy: arg.via,
          charged: def.skillType === "normal" && player.dice.length % 2 === 0,
          plunging: def.skillType === "normal" && player.canPlunging,
        };
        await this.finalizeSkill(skillInfo, void 0);
      } else {
        const onTimeState = arg._state;
        const entities = allEntities(onTimeState, true);
        for (const entity of entities) {
          for (const sk of entity.definition.skills) {
            if (sk.triggerOn === name) {
              const currentEntities = allEntities(this.state);
              let caller: AnyState;
              // 对于弃置事件，额外地使被弃置的实体本身也能响应（但是调整技能调用者为当前玩家出战角色）
              if (name === "onDispose" && arg.entity === entity) {
                const who = getEntityArea(arg._state, arg.entity.id).who;
                caller = getEntityById(
                  this.state,
                  this.state.players[who].activeCharacterId,
                  true,
                );
              } else if (!currentEntities.find((et) => et.id === entity.id)) {
                continue;
              } else {
                caller = entity;
              }
              const skillInfo: SkillInfo = {
                caller,
                definition: sk,
                fromCard: null,
                requestBy: null,
                charged: false,
                plunging: false,
              };
              await this.finalizeSkill(skillInfo, arg);
            }
          }
        }
      }
    }
  }

  getState() {
    return this.state;
  }

  static fromEvents() {}
  static fromSkill() {}
}
