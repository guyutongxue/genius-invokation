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
  SwitchActiveEventArg,
  ZeroHealthEventArg,
} from "./base/skill";
import { AnyState, CharacterState, GameState } from "./base/state";
import { Aura, DamageType, Event } from "@gi-tcg/typings";
import {
  allEntities,
  checkImmune,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
} from "./util";
import { GiTcgCoreInternalError, GiTcgDataError } from "./error";
import { Mutation, applyMutation } from "./base/mutation";
import { flip } from "@gi-tcg/utils";
import { GameStateLogEntry } from "./log";
import { Writable } from "./util";

interface IoDuringSkillFinalize {
  switchCard(who: 0 | 1): Promise<void>;
  reroll(who: 0 | 1, times: number): Promise<void>;
  notifyAndPause(opt: Partial<GameStateLogEntry>): Promise<void>;
  chooseActive(who: 0 | 1, state: GameState): Promise<CharacterState>;
}

interface IoAndState extends IoDuringSkillFinalize {
  readonly state: GameState;
}

class GiTcgIoNotProvideError extends GiTcgCoreInternalError {
  constructor() {
    super("IO is not provided. This error should be caught.");
  }
}

export type GeneralSkillArg = EventArg | CardSkillEventArg | void;

export class SkillExecutor {
  private constructor(
    private state: GameState,
    private readonly _io?: IoDuringSkillFinalize,
  ) {}

  private get io() {
    if (!this._io) {
      throw new GiTcgIoNotProvideError();
    }
    return this._io;
  }

  private notify(events: readonly Event[]) {
    if (this._io) {
      return this._io.notifyAndPause({ state: this.state, events });
    }
  }

  private mutate(mut: Mutation) {
    this.state = applyMutation(this.state, mut);
  }

  async finalizeSkill(
    skillInfo: SkillInfo,
    arg: GeneralSkillArg,
  ): Promise<void> {
    if (this.state.phase === "gameEnd") {
      return;
    }
    const callerArea = getEntityArea(this.state, skillInfo.caller.id);
    const skillDef = skillInfo.definition;
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
      const damageInfo = arg.damageInfo;
      if (damageInfo.target.variables.alive) {
        notifyEvents.push({
          type: "damage",
          damage: {
            type: damageInfo.type,
            value: damageInfo.value,
            target: damageInfo.target.id,
            log: arg.log(),
          },
        });
      }
    }
    for (const [eventName, arg] of nonDamageEvents) {
      if (eventName === "onReaction" && arg.target.variables.alive) {
        notifyEvents.push({
          type: "elementalReaction",
          on: arg.target.id,
          reactionType: arg.type,
        });
      }
    }

    await this.notify(notifyEvents);

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
        } else {
          const { id } = arg.target;
          const ch = getEntityById(this.state, id, true) as CharacterState;
          const { who } = getEntityArea(this.state, id);
          if (ch.variables.alive) {
            this.mutate({
              type: "modifyEntityVar",
              state: ch,
              varName: "alive",
              value: 0,
            });
            this.mutate({
              type: "modifyEntityVar",
              state: ch,
              varName: "energy",
              value: 0,
            });
            this.mutate({
              type: "modifyEntityVar",
              state: ch,
              varName: "aura",
              value: Aura.None,
            });
            this.mutate({
              type: "setPlayerFlag",
              who,
              flagName: "hasDefeated",
              value: true,
            });
            const player = this.state.players[who];
            const aliveCharacters = player.characters.filter(
              (ch) => ch.variables.alive,
            );
            if (aliveCharacters.length === 0) {
              this.mutate({
                type: "setWinner",
                winner: flip(who),
              });
              this.mutate({
                type: "changePhase",
                newPhase: "gameEnd",
              });
              await this.notify([]);
              return;
            }
          }
        }
        damageEventArgs.push(zeroHealthEventArg);
      } else {
        damageEventArgs.push(arg);
      }
    }
    const safeDamageEvents = damageEventArgs.filter(
      (arg) => !arg.damageInfo.causeDefeated,
    );
    const criticalDamageEvents = damageEventArgs.filter(
      (arg) => arg.damageInfo.causeDefeated,
    );
    if (criticalDamageEvents.length > 0) {
      await this.notify([]);
    }

    for (const arg of zeroHealthEventArgs) {
      await this.handleEvent(["modifyZeroHealth", arg]);
      if (arg._immuneInfo !== null) {
        const healValue = arg._immuneInfo.newHealth;
        const healInfo: HealInfo = {
          type: DamageType.Revive,
          source: arg._immuneInfo.skill.caller,
          via: arg._immuneInfo.skill,
          target: arg.target,
          expectedValue: healValue,
          value: healValue,
          causeDefeated: false,
          fromReaction: null,
          roundNumber: this.state.roundNumber,
        };
        await this.notify([
          {
            type: "damage",
            damage: {
              type: healInfo.type,
              value: healInfo.value,
              target: healInfo.target.id,
              log: "",
            },
          },
        ]);
        const healEventArg = new DamageOrHealEventArg(this.state, healInfo);
        await this.handleEvent(["onDamageOrHeal", healEventArg]);
      }
    }

    if (
      skillDef.gainEnergy &&
      skillInfo.caller.definition.type === "character"
    ) {
      const ch = getEntityById(
        this.state,
        skillInfo.caller.id,
        true,
      ) as CharacterState;
      if (ch.variables.alive) {
        const currentEnergy = ch.variables.energy;
        const newEnergy = Math.min(currentEnergy + 1, ch.variables.maxEnergy);
        this.mutate({
          type: "modifyEntityVar",
          state: ch,
          varName: "energy",
          value: newEnergy,
        });
        await this.notify([]);
      }
    }

    await this.handleEvent(...nonDamageEvents);
    for (const arg of safeDamageEvents) {
      await this.handleEvent(["onDamageOrHeal", arg]);
    }
    for (const arg of criticalDamageEvents) {
      await this.handleEvent(["onDamageOrHeal", arg]);
    }
    const switchEvents: [
      null | Promise<SwitchActiveEventArg>,
      null | Promise<SwitchActiveEventArg>,
    ] = [null, null];
    for (const who of [0, 1] as const) {
      const player = this.state.players[who];
      const [activeCh] = player.characters.shiftLeft(
        getActiveCharacterIndex(player),
      );
      if (activeCh.variables.alive) {
        continue;
      }
      switchEvents[who] = this.io.chooseActive(who, this.state).then(
        (to) =>
          new SwitchActiveEventArg(this.state, {
            type: "switchActive",
            from: activeCh,
            to,
            who,
          }),
      );
    }
    const args = await Promise.all(switchEvents);
    const currentTurn = this.state.currentTurn;
    for (const arg of args) {
      if (arg) {
        this.mutate({
          type: "switchActive",
          who: arg.switchInfo.who,
          value: arg.switchInfo.to,
        });
      }
    }
    for (const who of [currentTurn, flip(currentTurn)]) {
      const arg = args[who];
      if (arg) {
        await this.handleEvent(["onSwitchActive", arg]);
      }
    }
  }

  async handleEvent(...actions: EventAndRequest[]) {
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
        if (this._io && name === "onDamageOrHeal") {
          console.log({
            damageInfo: arg.damageInfo,
            entities,
          });
        }
        for (const entity of entities) {
          for (const sk of entity.definition.skills) {
            if (sk.triggerOn === name) {
              const skillInfo: Writable<SkillInfo> = {
                caller: entity,
                definition: sk,
                fromCard: null,
                requestBy: null,
                charged: false,
                plunging: false,
              };
              if (!(0, sk.filter)(onTimeState, skillInfo, arg)) {
                continue;
              }
              const currentEntities = allEntities(this.state);
              // 对于弃置事件，额外地使被弃置的实体本身也能响应（但是调整技能调用者为当前玩家出战角色）
              if (name === "onDispose" && arg.entity.id === entity.id) {
                const who = getEntityArea(arg._state, arg.entity.id).who;
                skillInfo.caller = getEntityById(
                  this.state,
                  this.state.players[who].activeCharacterId,
                  true,
                );
              } else if (!currentEntities.find((et) => et.id === entity.id)) {
                continue;
              }
              arg._currentSkillInfo = skillInfo;
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

  static async executeSkill(
    game: IoAndState,
    skill: SkillInfo,
    arg: GeneralSkillArg,
  ) {
    const executor = new SkillExecutor(game.state, game);
    await executor.finalizeSkill(skill, arg);
    return executor.state;
  }
  static async previewSkill(
    state: GameState,
    skill: SkillInfo,
    arg: GeneralSkillArg,
  ) {
    const executor = new SkillExecutor(state);
    try {
      await executor.finalizeSkill(skill, arg);
    } catch (e) {
      if (e instanceof GiTcgIoNotProvideError) {
      } else {
        throw e;
      }
    }
    return executor.state;
  }
  static async handleEvent(game: IoAndState, ...event: EventAndRequest) {
    return SkillExecutor.handleEvents(game, [event]);
  }
  static async previewEvent(state: GameState, ...event: EventAndRequest) {
    const executor = new SkillExecutor(state);
    try {
      await executor.handleEvent(event);
    } catch (e) {
      if (e instanceof GiTcgIoNotProvideError) {
      } else {
        throw e;
      }
    }
    return executor.state;
  }
  static async handleEvents(game: IoAndState, events: EventAndRequest[]) {
    const executor = new SkillExecutor(game.state, game);
    await executor.handleEvent(...events);
    return executor.state;
  }
}
