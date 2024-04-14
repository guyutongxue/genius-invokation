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

import { checkDice, flip } from "@gi-tcg/utils";
import {
  Aura,
  DamageType,
  DiceType,
  Event,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/typings";
import { verifyRpcRequest, verifyRpcResponse } from "@gi-tcg/typings/verify";
import {
  AnyState,
  CharacterState,
  GameConfig,
  GameState,
  PlayerState,
} from "./base/state";
import { Mutation, StepRandomM, applyMutation } from "./base/mutation";
import { GameIO, exposeAction, exposeMutation, exposeState } from "./io";
import {
  allEntities,
  drawCard,
  elementOfCharacter,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  findReplaceAction,
  shuffle,
  sortDice,
  isSkillDisabled,
  checkImmune,
} from "./util";
import { ReadonlyDataStore } from "./builder/registry";
import {
  ActionEventArg,
  ActionInfo,
  CharacterEventArg,
  DamageInfo,
  DamageOrHealEventArg,
  ElementalTuningInfo,
  EntityEventArg,
  EventAndRequest,
  EventArg,
  EventArgOf,
  EventNames,
  HealInfo,
  ModifyActionEventArg,
  ModifyRollEventArg,
  PlayerEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  SwitchActiveInfo,
  ZeroHealthEventArg,
} from "./base/skill";
import { CardDefinition, CardSkillEventArg } from "./base/card";
import { executeQueryOnState } from "./query";
import {
  GiTcgCoreInternalError,
  GiTcgDataError,
  GiTcgError,
  GiTcgIOError,
} from "./error";
import { GameStateLogEntry } from "./log";
import { EntityArea } from "./base/entity";
import { randomSeed } from "./random";

export interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

const INITIAL_ID = -500000;

const IO_CHECK_GIVEUP_INTERVAL = 500;

type ActionInfoWithNewState = ActionInfo & {
  readonly newState: GameState;
  readonly deferredEventList: EventAndRequest[];
};

export class Game {
  private readonly data: ReadonlyDataStore;
  private readonly config: GameConfig;
  private readonly playerConfigs: readonly [PlayerConfig, PlayerConfig];
  private readonly io: GameIO;

  private state: GameState;
  private _stateLog: GameStateLogEntry[] = [];
  private _terminated = false;
  private finishPromise: Promise<0 | 1 | null> | null = null;
  private resolveFinishPromise: () => void = () => {};
  private rejectFinishPromise: (e: GiTcgError) => void = () => {};

  constructor(opt: GameOption) {
    this.data = opt.data;
    this.config = mergeGameConfigWithDefault(opt.gameConfig);
    this.playerConfigs = opt.playerConfigs;
    this.io = opt.io;
    this.state = {
      data: this.data,
      config: this.config,
      iterators: {
        random: this.config.randomSeed,
        id: INITIAL_ID,
      },
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 0,
      mutationLog: [],
      globalPlayCardLog: [],
      globalUseSkillLog: [],
      winner: null,
      players: [this.initPlayerState(0), this.initPlayerState(1)],
    };
    this._stateLog.push({
      state: this.state,
      canResume: false,
      events: [],
    });
    this.initPlayerCards(0);
    this.initPlayerCards(1);
  }

  get stateLog() {
    return this._stateLog;
  }

  mutate(mutation: Mutation) {
    if (!this._terminated) {
      this.state = applyMutation(this.state, mutation);
    }
  }

  query(who: 0 | 1, query: string): AnyState[] {
    return executeQueryOnState(this.state, who, query);
  }

  private randomDice(count: number, alwaysOmni?: boolean): readonly DiceType[] {
    if (alwaysOmni) {
      return new Array<DiceType>(count).fill(DiceType.Omni);
    }
    const mut: StepRandomM = {
      type: "stepRandom",
      value: 0,
    };
    const result: DiceType[] = [];
    for (let i = 0; i < count; i++) {
      this.mutate(mut);
      result.push((mut.value % 8) + 1);
    }
    return result;
  }

  /** 获取玩家初始状态，主要是初始化“起始牌堆” */
  private initPlayerState(who: 0 | 1): PlayerState {
    const config = this.playerConfigs[who];
    let initialPiles: readonly CardDefinition[] = config.cards.map((id) => {
      const def = this.data.cards.get(id);
      if (typeof def === "undefined") {
        throw new GiTcgDataError(`Unknown card id ${id}`);
      }
      return def;
    });
    if (!config.noShuffle) {
      initialPiles = shuffle(initialPiles);
    }
    // 将秘传牌放在最前面
    function compFn(def: CardDefinition) {
      if (def.tags.includes("legend")) {
        return 0;
      } else {
        return 1;
      }
    }
    initialPiles = initialPiles.toSorted((a, b) => compFn(a) - compFn(b));
    return {
      activeCharacterId: 0,
      characters: [],
      initialPiles,
      piles: [],
      hands: [],
      dice: [],
      combatStatuses: [],
      summons: [],
      supports: [],
      declaredEnd: false,
      canPlunging: false,
      hasDefeated: false,
      legendUsed: false,
      skipNextTurn: false,
      disposedSupportCount: 0,
    };
  }
  /** 初始化玩家的角色牌和牌堆 */
  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = this.data.characters.get(ch);
      if (typeof def === "undefined") {
        throw new GiTcgDataError(`Unknown character id ${ch}`);
      }
      this.mutate({
        type: "createCharacter",
        who,
        value: {
          id: 0,
          definition: def,
          variables: Object.fromEntries(
            Object.entries(def.varConfigs).map(([name, { initialValue }]) => [
              name,
              initialValue,
            ]),
          ) as any,
          entities: [],
          damageLog: [],
        },
      });
    }
    for (const card of this.state.players[who].initialPiles) {
      this.mutate({
        type: "createCard",
        who,
        value: {
          id: 0,
          definition: card,
        },
        target: "piles",
      });
    }
  }

  private notifyOne(who: 0 | 1, events: readonly Event[] = []) {
    const player = this.io.players[who];
    player.notify({
      events: [...events],
      mutations: this.state.mutationLog.flatMap((m) => {
        const ex = exposeMutation(who, m.mutation);
        return ex ? [ex] : [];
      }),
      newState: exposeState(who, this.state),
    });
  }
  private async notifyAndPause(events: readonly Event[], canResume = false) {
    if (this._terminated) {
      return;
    }
    this._stateLog.push({
      state: this.state,
      canResume,
      events,
    });
    for (const i of [0, 1] as const) {
      this.notifyOne(i, events);
    }
    await this.io.pause?.(this.state, [...events]);
    if (this.state.phase !== "gameEnd") {
      this.mutate({ type: "clearMutationLog" });
      await this.checkGiveUp();
    }
  }
  private checkGiveUp() {
    if (this.io.players[0].giveUp) {
      return this.gotWinner(1);
    } else if (this.io.players[1].giveUp) {
      return this.gotWinner(0);
    } else {
      return null;
    }
  }

  async start(): Promise<0 | 1 | null> {
    if (this.finishPromise !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    this.finishPromise = new Promise((resolve, reject) => {
      this.resolveFinishPromise = () => resolve(this.state.winner);
      this.rejectFinishPromise = (e) => reject(e);
    });
    (async () => {
      try {
        await this.notifyAndPause([], true);
        while (!this._terminated) {
          switch (this.state.phase) {
            case "initHands":
              await this.initHands();
              break;
            case "initActives":
              await this.initActives();
              break;
            case "roll":
              await this.rollPhase();
              break;
            case "action":
              await this.actionPhase();
              break;
            case "end":
              await this.endPhase();
              break;
            default:
              break;
          }
          await this.notifyAndPause([], true);
        }
      } catch (e) {
        if (e instanceof GiTcgIOError) {
          this.io.onIoError?.(e);
          await this.gotWinner(flip(e.who));
        } else if (e instanceof GiTcgError) {
          this.rejectFinishPromise(e);
        } else {
          let message = String(e);
          if (e instanceof Error) {
            message = e.message;
            if (e.stack) {
              message += "\n" + e.stack;
            }
          }
          this.rejectFinishPromise(
            new GiTcgCoreInternalError(`Unexpected error: ` + message),
          );
        }
      }
    })();
    return this.finishPromise;
  }

  async startFromState(state: GameState) {
    if (this.finishPromise !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    this.state = state;
    return this.start();
  }

  async startWithStateLog(log: readonly GameStateLogEntry[]) {
    if (this.finishPromise !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    if (log.length === 0) {
      throw new GiTcgCoreInternalError(
        "Provided state log should at least contains 1 log entry",
      );
    }
    const allLogs = [...log];
    this.state = allLogs.pop()!.state;
    this._stateLog = allLogs;
    return this.start();
  }

  /** 胜负已定，切换到 gameEnd 阶段 */
  private async gotWinner(winner: 0 | 1 | null) {
    this.mutate({
      type: "changePhase",
      newPhase: "gameEnd",
    });
    if (winner !== null) {
      this.mutate({
        type: "setWinner",
        winner,
      });
    }
    await this.notifyAndPause([], false);
    this.resolveFinishPromise();
    if (!this._terminated) {
      this._terminated = true;
      Object.freeze(this);
    }
  }
  /** 强制终止游戏，不再进行额外改动 */
  terminate() {
    this.rejectFinishPromise(
      new GiTcgCoreInternalError("User call terminate."),
    );
    if (!this._terminated) {
      this._terminated = true;
      Object.freeze(this);
    }
  }

  private async rpc<M extends RpcMethod>(
    who: 0 | 1,
    method: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[M]> {
    if (this._terminated) {
      throw new GiTcgCoreInternalError(`Game has been terminated`);
    }
    try {
      verifyRpcRequest(method, req);
    } catch (e) {
      console.warn("Rpc request verify failed", e);
    }
    // IO 的同时轮询检查是否有投降，若有立即结束对局
    const interval = setInterval(() => {
      if (this._terminated) {
        clearInterval(interval);
      } else {
        this.checkGiveUp();
      }
    }, IO_CHECK_GIVEUP_INTERVAL);
    try {
      const resp = await this.io.players[who].rpc(method, req);
      verifyRpcResponse(method, resp);
      return resp;
    } catch (e) {
      if (e instanceof Error) {
        throw new GiTcgIOError(who, e.message, { cause: e?.cause });
      } else {
        throw new GiTcgIOError(who, String(e));
      }
    } finally {
      clearInterval(interval);
    }
  }

  private async initHands() {
    for (let who of [0, 1] as const) {
      for (let i = 0; i < this.config.initialHands; i++) {
        this.state = drawCard(this.state, who, null);
      }
    }
    this.notifyAndPause([]);
    await Promise.all([this.switchCard(0), this.switchCard(1)]);
    this.mutate({
      type: "changePhase",
      newPhase: "initActives",
    });
  }

  private async initActives() {
    const [a0, a1] = await Promise.all(
      ([0, 1] as const).map(async (i) => {
        const player = this.state.players[i];
        this.notifyOne(flip(i), [
          {
            type: "oppChoosingActive",
          },
        ]);
        const { active } = await this.rpc(i, "chooseActive", {
          candidates: player.characters.map((c) => c.id),
        });
        return getEntityById(this.state, active, true) as CharacterState;
      }),
    );
    this.mutate({
      type: "switchActive",
      who: 0,
      value: a0,
    });
    this.mutate({
      type: "switchActive",
      who: 1,
      value: a1,
    });
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
    // For debugging
    Reflect.set(globalThis, "$$", (query: string) => this.query(0, query));
    await this.emitEvent("onBattleBegin", new EventArg(this.state));
  }

  private async rollPhase() {
    this.mutate({
      type: "stepRound",
    });
    // onRoll event
    interface RollParams {
      fixed: readonly DiceType[];
      count: number;
    }
    const rollParams: RollParams[] = [];
    for (const who of [0, 1] as const) {
      const rollModifier = new ModifyRollEventArg(this.state, who);
      await this.emitEvent("modifyRoll", rollModifier);
      rollParams.push({
        fixed: rollModifier._fixedDice,
        count: 1 + rollModifier._extraRerollCount,
      });
    }

    await Promise.all(
      ([0, 1] as const).map(async (who) => {
        const { fixed, count } = rollParams[who];
        const initDice = sortDice(this.state.players[who], [
          ...fixed,
          ...this.randomDice(
            Math.max(0, this.config.initialDice - fixed.length),
            this.playerConfigs[who].alwaysOmni,
          ),
        ]);
        this.mutate({
          type: "resetDice",
          who,
          value: initDice,
        });
        this.notifyOne(who);
        await this.reroll(who, count);
      }),
    );
    // Change to action phase:
    // - do `changePhase`
    // - clean `hasDefeated`
    // - clean `declaredEnd`
    // - emit event `actionPhase`
    this.mutate({
      type: "changePhase",
      newPhase: "action",
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 0,
      flagName: "hasDefeated",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 1,
      flagName: "hasDefeated",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 0,
      flagName: "declaredEnd",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 1,
      flagName: "declaredEnd",
      value: false,
    });
    await this.emitEvent("onActionPhase", new EventArg(this.state));
  }
  private async actionPhase() {
    const who = this.state.currentTurn;
    // 使用 getter 防止状态变化后原有 player 过时的问题
    const player = () => this.state.players[who];
    const activeCh = () =>
      player().characters[getActiveCharacterIndex(player())];
    let replaceAction: SkillInfo | null;
    if (player().declaredEnd) {
      this.mutate({
        type: "switchTurn",
      });
    } else if (player().skipNextTurn) {
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "skipNextTurn",
        value: false,
      });
      this.mutate({
        type: "switchTurn",
      });
    } else if (
      (replaceAction = findReplaceAction(activeCh())) &&
      !isSkillDisabled(activeCh())
    ) {
      await this.useSkill(replaceAction, new EventArg(this.state));
      this.mutate({
        type: "switchTurn",
      });
    } else {
      await this.emitEvent(
        "onBeforeAction",
        new PlayerEventArg(this.state, who),
      );
      const actions = await this.availableAction();
      this.notifyOne(flip(who), [
        {
          type: "oppAction",
        },
      ]);
      const { chosenIndex, cost } = await this.rpc(who, "action", {
        candidates: actions.map(exposeAction),
      });
      if (chosenIndex < 0 || chosenIndex >= actions.length) {
        throw new GiTcgIOError(who, `User chosen index out of range`);
      }
      const actionInfo = actions[chosenIndex];
      this.state = actionInfo.newState;
      await this.handleEvents(actionInfo.deferredEventList, true);

      // 检查骰子
      if (!checkDice(actionInfo.cost, cost)) {
        throw new GiTcgIOError(who, `Selected dice doesn't meet requirement`);
      }
      if (
        actionInfo.type === "elementalTuning" &&
        (cost[0] === DiceType.Omni || cost[0] === actionInfo.result)
      ) {
        throw new GiTcgIOError(
          who,
          `Elemental tunning cannot use omni dice or active character's element`,
        );
      }
      // 消耗骰子
      const operatingDice = [...player().dice];
      for (const consumed of cost) {
        if (consumed === DiceType.Energy) {
        } else {
          const idx = operatingDice.indexOf(consumed);
          if (idx === -1) {
            throw new GiTcgIOError(
              who,
              `Selected dice (${consumed}) not found in player`,
            );
          }
          operatingDice.splice(idx, 1);
        }
      }
      this.mutate({
        type: "resetDice",
        who,
        value: operatingDice,
      });
      // 消耗能量
      const requiredEnergy = actionInfo.cost.filter(
        (x) => x === DiceType.Energy,
      ).length;
      const currentEnergy = activeCh().variables.energy;
      if (requiredEnergy > 0) {
        if (currentEnergy < requiredEnergy) {
          throw new GiTcgIOError(
            who,
            `Active character does not have enough energy`,
          );
        }
        this.mutate({
          type: "modifyEntityVar",
          state: activeCh(),
          varName: "energy",
          value: currentEnergy - requiredEnergy,
        });
      }

      switch (actionInfo.type) {
        case "useSkill":
          await this.useSkill(actionInfo.skill, void 0);
          break;
        case "playCard":
          if (actionInfo.card.definition.tags.includes("legend")) {
            this.mutate({
              type: "setPlayerFlag",
              who,
              flagName: "legendUsed",
              value: true,
            });
          }
          // 裁定之时：禁用效果
          if (
            player().combatStatuses.find((st) =>
              st.definition.tags.includes("disableEvent"),
            ) &&
            actionInfo.card.definition.type === "event"
          ) {
            this.mutate({
              type: "disposeCard",
              who,
              oldState: actionInfo.card,
              used: false,
            });
          } else {
            this.mutate({
              type: "disposeCard",
              who,
              oldState: actionInfo.card,
              used: true,
            });
            await this.useSkill(
              {
                caller: activeCh(),
                definition: actionInfo.card.definition.skillDefinition,
                fromCard: actionInfo.card,
                requestBy: null,
                charged: false,
                plunging: false,
              },
              {
                targets: actionInfo.targets,
              },
            );
          }
          break;
        case "switchActive":
          this.switchActive(who, actionInfo.to);
          break;
        case "elementalTuning":
          this.mutate({
            type: "disposeCard",
            who,
            oldState: actionInfo.card,
            used: false,
          });
          this.mutate({
            type: "resetDice",
            who,
            value: sortDice(player(), [
              ...player().dice,
              elementOfCharacter(activeCh().definition),
            ]),
          });
          break;
        case "declareEnd":
          this.mutate({
            type: "setPlayerFlag",
            who,
            flagName: "declaredEnd",
            value: true,
          });
          break;
      }
      if (!actionInfo.fast) {
        this.mutate({
          type: "switchTurn",
        });
      }
      await this.emitEvent(
        "onAction",
        new ActionEventArg(actionInfo.newState, actionInfo),
      );
      this.mutate({
        type: "pushActionLog",
        who,
        action: actionInfo,
      });
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "canPlunging",
        value: actionInfo.type === "switchActive",
      });
    }
    if (
      this.state.players[0].declaredEnd &&
      this.state.players[1].declaredEnd
    ) {
      this.mutate({
        type: "changePhase",
        newPhase: "end",
      });
    }
  }
  private async endPhase() {
    await this.emitEvent("onEndPhase", new EventArg(this.state));
    for (const who of [0, 1] as const) {
      for (let i = 0; i < 2; i++) {
        this.state = drawCard(this.state, who, null);
      }
    }
    if (this.state.roundNumber >= this.config.maxRounds) {
      this.gotWinner(null);
    } else {
      this.mutate({
        type: "changePhase",
        newPhase: "roll",
      });
    }
  }

  async availableAction(): Promise<ActionInfoWithNewState[]> {
    const who = this.state.currentTurn;
    const player = this.state.players[who];
    const activeCh = player.characters[getActiveCharacterIndex(player)];
    const result: ActionInfo[] = [];

    // Skills
    if (isSkillDisabled(activeCh)) {
      // Use skill is disabled, skip
    } else {
      for (const skill of activeCh.definition.initiativeSkills) {
        const skillInfo = {
          caller: activeCh,
          definition: skill,
          fromCard: null,
          requestBy: null,
          charged: skill.skillType === "normal" && player.dice.length % 2 === 0,
          plunging: skill.skillType === "normal" && player.canPlunging,
        };
        const previewState = await this.getStatePreview(skillInfo);
        result.push({
          type: "useSkill",
          who,
          skill: skillInfo,
          fast: false,
          cost: [...skill.requiredCost],
          preview: previewState,
        });
      }
    }

    // Cards
    for (const card of player.hands) {
      let allTargets: CardSkillEventArg[];
      const skillInfo: SkillInfo = {
        caller: activeCh,
        definition: card.definition.skillDefinition,
        fromCard: card,
        requestBy: null,
        charged: false,
        plunging: false,
      };
      // 当支援区满时，卡牌目标为“要离场的支援牌”
      if (
        card.definition.type === "support" &&
        player.supports.length === this.state.config.maxSupports
      ) {
        allTargets = player.supports.map((st) => ({ targets: [st] }));
      } else {
        allTargets = (0, card.definition.getTarget)(this.state, skillInfo);
      }
      for (const arg of allTargets) {
        if ((0, card.definition.filter)(this.state, skillInfo, arg)) {
          result.push({
            type: "playCard",
            who,
            card,
            targets: arg.targets,
            cost: [...card.definition.skillDefinition.requiredCost],
            fast: !card.definition.tags.includes("action"),
          });
        }
      }
    }

    // Switch Active
    result.push(
      ...player.characters
        .filter((ch) => ch.variables.alive && ch.id !== activeCh.id)
        .map<SwitchActiveInfo>((ch) => ({
          type: "switchActive",
          from: activeCh,
          to: ch,
          who,
        }))
        .map((s) => ({
          ...s,
          fast: false,
          cost: [DiceType.Void],
        })),
    );

    // Elemental Tuning
    const resultDiceType = elementOfCharacter(activeCh.definition);
    result.push(
      ...player.hands
        .map<ElementalTuningInfo>((c) => ({
          type: "elementalTuning",
          card: c,
          who,
          result: resultDiceType,
        }))
        .map((s) => ({
          ...s,
          fast: true,
          cost: [DiceType.Void],
        })),
    );

    // Declare End
    result.push({
      type: "declareEnd",
      who,
      fast: false,
      cost: [],
    });
    // Apply beforeUseDice, calculate new state for each action
    const resultWithState: ActionInfoWithNewState[] = [];
    const currentState = this.state;
    for (const actionInfo of result) {
      const eventArg = new ModifyActionEventArg(this.state, actionInfo);
      const deferredEventList = await this.emitEventShallow(
        "modifyAction",
        eventArg,
      );
      resultWithState.push({
        ...eventArg.action,
        newState: this.state,
        deferredEventList,
      });
      this.state = currentState;
    }
    return resultWithState;
  }

  /**
   * 仅在 `useSkill` 或 `doHandleEvents` 中调用。
   */
  private async useSkill(
    skillInfo: SkillInfo,
    arg: EventArg | CardSkillEventArg | void,
    hasIo = true,
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

    if (hasIo) {
      await this.notifyAndPause(notifyEvents);
    }

    const damageEventArgs: DamageOrHealEventArg<DamageInfo | HealInfo>[] = [];
    const zeroHealthEventArgs: ZeroHealthEventArg[] = [];
    for (const [, arg] of damageEvents) {
      if (arg.damageInfo.causeDefeated) {
        const zeroHealthEventArg = new ZeroHealthEventArg(this.state, arg.damageInfo);
        if (checkImmune(this.state, zeroHealthEventArg)) {
          zeroHealthEventArgs.push(zeroHealthEventArg);
        }
        damageEventArgs.push(zeroHealthEventArg);
      } else {
        damageEventArgs.push(arg);
      }
    }


    return eventList;
  }

  /** 获取主动技能的使用后对局预览 */
  async getStatePreview(skillInfo: SkillInfo) {
    const oldState = this.state;
    let newState = this.state;
    try {
      await this.useSkill(skillInfo, void 0, false);
      newState = this.state;
    } catch {
    } finally {
      this.state = oldState;
      return newState;
    }
  }

  private async switchCard(who: 0 | 1) {
    const { removedHands } = await this.rpc(who, "switchHands", {});
    const cardStates = removedHands.map((id) => {
      const card = this.state.players[who].hands.find((c) => c.id === id);
      if (typeof card === "undefined") {
        throw new GiTcgDataError(`Unknown card id ${id}`);
      }
      return card;
    });
    for (const st of cardStates) {
      this.mutate({
        type: "transferCard",
        path: "handsToPiles",
        who,
        value: st,
      });
    }
    const count = cardStates.length;
    for (let i = 0; i < count; i++) {
      this.state = drawCard(this.state, who, null);
    }
    this.notifyOne(who);
    this.notifyOne(flip(who));
  }
  private async reroll(who: 0 | 1, times: number) {
    for (let i = 0; i < times; i++) {
      const dice = this.state.players[who].dice;
      const { rerollIndexes } = await this.rpc(who, "rerollDice", {});
      if (rerollIndexes.length === 0) {
        return;
      }
      const controlled: DiceType[] = [];
      for (let k = 0; k < dice.length; k++) {
        if (!rerollIndexes.includes(k)) {
          controlled.push(dice[k]);
        }
      }
      this.mutate({
        type: "resetDice",
        who,
        value: sortDice(this.state.players[who], [
          ...controlled,
          ...this.randomDice(rerollIndexes.length),
        ]),
      });
      this.notifyOne(who);
    }
  }

  private async switchActive(who: 0 | 1, to: CharacterState) {
    const player = this.state.players[who];
    const from = player.characters[getActiveCharacterIndex(player)];
    const oldState = this.state;
    this.mutate({
      type: "switchActive",
      who,
      value: to,
    });
    await this.emitEvent(
      "onSwitchActive",
      new SwitchActiveEventArg(oldState, {
        type: "switchActive",
        who,
        from,
        to,
      }),
    );
  }

  private async *doHandleEvents(
    actions: EventAndRequest[],
    hasIo: boolean,
  ): AsyncGenerator<EventAndRequest[], void> {
    
  }

  // 检查倒下角色，若有返回 `true`
  private async checkDefeated(): Promise<boolean> {
    const currentTurn = this.state.currentTurn;
    // 指示双方出战角色是否倒下，若有则 await（等待用户操作）
    const activeDefeated: (Promise<CharacterState> | null)[] = [null, null];
    for (const who of [currentTurn, flip(currentTurn)]) {
      const player = this.state.players[who];
      const activeIdx = getActiveCharacterIndex(player);
      for (const ch of player.characters.shiftLeft(activeIdx)) {
        if (ch.variables.alive && ch.variables.health <= 0) {
          const zeroHealthEventArg = new ZeroHealthEventArg(this.state, ch);
          await this.emitEvent("modifyZeroHealth", zeroHealthEventArg);
          if (
            zeroHealthEventArg._immuneInfo !== null &&
            zeroHealthEventArg._immuneInfo.newHealth > 0
          ) {
            this.mutate({
              type: "modifyEntityVar",
              state: ch,
              varName: "health",
              value: zeroHealthEventArg._immuneInfo.newHealth,
            });
            const healInfo: HealInfo = {
              type: DamageType.Revive,
              source: zeroHealthEventArg._immuneInfo.skill.caller,
              target: ch,
              value: zeroHealthEventArg._immuneInfo.newHealth,
              expectedValue: zeroHealthEventArg._immuneInfo.newHealth,
              causeDefeated: false,
              via: zeroHealthEventArg._immuneInfo.skill,
              roundNumber: this.state.roundNumber,
              fromReaction: null,
            };
            this.mutate({
              type: "pushDamageLog",
              damage: healInfo,
            });
            await this.emitEvent(
              "onDamageOrHeal",
              new DamageOrHealEventArg(this.state, healInfo),
            );
            continue;
          }
          let mut: Mutation = {
            type: "modifyEntityVar",
            state: ch,
            varName: "alive",
            value: 0,
          };
          this.mutate(mut);
          // 清空元素附着、能量
          // 装备和状态的清除通过响应 onDefeated 实现
          mut = {
            ...mut,
            varName: "aura",
            value: Aura.None,
          };
          this.mutate(mut);
          mut = {
            ...mut,
            varName: "energy",
            value: 0,
          };
          this.mutate(mut);
          // 如果出战角色倒下，那么令用户选择新的出战角色
          if (ch.id === player.activeCharacterId) {
            const candidates = this.state.players[who].characters
              .filter((c) => c.variables.alive)
              .map((c) => c.id);
            if (candidates.length === 0) {
              await this.gotWinner(flip(who));
              return true;
            }
            this.notifyOne(flip(who), [
              {
                type: "oppChoosingActive",
              },
            ]);
            activeDefeated[who] = this.rpc(who, "chooseActive", {
              candidates,
            }).then(({ active }) => {
              return getEntityById(this.state, active, true) as CharacterState;
            });
          }
        }
      }
      if (activeDefeated[who] !== null) {
        this.mutate({
          type: "setPlayerFlag",
          who,
          flagName: "hasDefeated",
          value: true,
        });
      }
    }
    if (defeatEvents.length > 0) {
      await this.notifyAndPause([]);
    }
    const newActives = await Promise.all(activeDefeated);
    // “双死”：当前轮次的切换事件先发生
    const firstSwitchActiveTarget = newActives[currentTurn];
    const secondSwitchActiveTarget = newActives[flip(currentTurn)];
    if (firstSwitchActiveTarget !== null) {
      await this.switchActive(currentTurn, firstSwitchActiveTarget);
    }
    if (secondSwitchActiveTarget !== null) {
      await this.switchActive(flip(currentTurn), secondSwitchActiveTarget);
    }
    return defeatEvents.length > 0;
  }

  private async handleEvents(actions: EventAndRequest[], hasIo: boolean) {
    for (const [name, arg] of actions) {
      if (name === "requestReroll") {
        if (hasIo) {
          await this.reroll(arg.who, arg.times);
        }
      } else if (name === "requestSwitchHands") {
        if (hasIo) {
          await this.switchCard(arg.who);
        }
      } else if (name === "requestUseSkill") {
        const def = this.data.skills.get(arg.requestingSkillId);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(
            `Unknown skill id ${arg.requestingSkillId} (requested by ${arg.caller.id} (defId = ${arg.caller.definition.id}))`,
          );
        }
        const skillInfo: SkillInfo = {
          caller: arg.caller,
          definition: def,
          fromCard: null,
          requestBy: arg.via,
          charged: false, // Can this be charged?
          plunging: false,
        };
        await this.useSkill(skillInfo, void 0, hasIo);
      } else {
        const onTimeState = arg._state;
        const entities = allEntities(onTimeState, true);
        for (const entity of entities) {
          for (const sk of entity.definition.skills) {
            if (sk.triggerOn === name) {
              const currentEntities = allEntities(this.state);
              let caller: AnyState;
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
              await this.useSkill(skillInfo, arg, hasIo);
            }
          }
        }
      }
    }
  }
  private async emitEvent<E extends EventNames>(
    name: E,
    arg: EventArgOf<E>,
    hasIo = true,
  ) {
    await this.handleEvents([[name, arg] as any], hasIo);
  }
  /**
   * 引发一个事件并处理。其处理过程中引发的级联事件不会递归执行，而是返回给调用者。
   * 同时该事件的处理会禁用 IO。
   */
  private async emitEventShallow(
    name: "modifyAction",
    arg: ModifyActionEventArg<ActionInfo>,
  ): Promise<EventAndRequest[]> {
    const allEvents = [];
    for await (const events of this.doHandleEvents([[name, arg]], false)) {
      allEvents.push(...events);
    }
    return allEvents;
  }
}

export interface GameOption {
  readonly data: ReadonlyDataStore;
  readonly gameConfig?: Partial<GameConfig>;
  readonly playerConfigs: readonly [PlayerConfig, PlayerConfig];
  readonly io: GameIO;
}

export function mergeGameConfigWithDefault(
  config?: Partial<GameConfig>,
): GameConfig {
  return {
    initialDice: 8,
    initialHands: 5,
    maxDice: 16,
    maxHands: 10,
    maxRounds: 15,
    maxSummons: 4,
    maxSupports: 4,
    randomSeed: randomSeed(),
    ...config,
  };
}
