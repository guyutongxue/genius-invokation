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
  DiceType,
  ExposedMutation,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/typings";
import { verifyRpcRequest, verifyRpcResponse } from "@gi-tcg/typings/verify";
import {
  AnyState,
  CardState,
  CharacterState,
  ExtensionState,
  GameConfig,
  GameState,
  PlayerState,
} from "./base/state";
import {
  Mutation,
  StepRandomM,
  applyMutation,
  stringifyMutation,
} from "./base/mutation";
import { GameIO, exposeAction, exposeMutation, exposeState } from "./io";
import {
  elementOfCharacter,
  getActiveCharacterIndex,
  getEntityById,
  findReplaceAction,
  shuffle,
  sortDice,
  isSkillDisabled,
} from "./utils";
import { ReadonlyDataStore } from "./builder/registry";
import {
  ActionEventArg,
  ActionInfo,
  ElementalTuningInfo,
  EventAndRequest,
  EventArg,
  ModifyActionEventArg,
  ModifyRollEventArg,
  PlayerEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  SwitchActiveInfo,
} from "./base/skill";
import { CardDefinition, CardSkillEventArg } from "./base/card";
import { executeQueryOnState } from "./query";
import {
  GiTcgCoreInternalError,
  GiTcgDataError,
  GiTcgError,
  GiTcgIOError,
} from "./error";
import {
  DetailLogType,
  DetailLogger,
  GameStateLogEntry,
  IDetailLogger,
} from "./log";
import { randomSeed } from "./random";
import { GeneralSkillArg, SkillExecutor } from "./skill_executor";
import {
  InternalNotifyOption,
  InternalPauseOption,
  NotifyOption,
  StateMutator,
} from "./mutator";

type Resolvers<T> = ReturnType<typeof Promise.withResolvers<T>>;

export interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

const INITIAL_ID = -500000;

const IO_CHECK_GIVEUP_INTERVAL = 500;

type ActionInfoWithModification = ActionInfo & {
  eventArg: ModifyActionEventArg<ActionInfo>;
};

/** 获取玩家初始状态，主要是初始化“起始牌堆” */
function initPlayerState(
  data: ReadonlyDataStore,
  playerConfig: PlayerConfig,
): PlayerState {
  let initialPiles: readonly CardDefinition[] = playerConfig.cards.map((id) => {
    const def = data.cards.get(id);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown card id ${id}`);
    }
    return def;
  });
  if (!playerConfig.noShuffle) {
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
  };
}

export class Game extends StateMutator {
  private readonly config: GameConfig;
  private readonly playerConfigs: readonly [PlayerConfig, PlayerConfig];
  private readonly io: GameIO;
  /** @internal */
  public readonly logger: DetailLogger;

  private _stateLog: GameStateLogEntry[] = [];
  private _terminated = false;
  private finishResolvers: Resolvers<0 | 1 | null> | null = null;

  constructor(opt: GameOption) {
    const config = mergeGameConfigWithDefault(opt.gameConfig);
    const extensions = [
      ...opt.data.extensions.values(),
    ].map<ExtensionState>((v) => ({
      definition: v,
      state: v.initialState,
    }));
    const initialState: GameState = {
      data: opt.data,
      config,
      iterators: {
        random: config.randomSeed,
        id: INITIAL_ID,
      },
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 0,
      winner: null,
      players: [
        initPlayerState(opt.data, opt.playerConfigs[0]),
        initPlayerState(opt.data, opt.playerConfigs[1]),
      ],
      extensions,
    };
    const logger = new DetailLogger();
    super(initialState, { logger });
    this.logger = logger;
    this.config = mergeGameConfigWithDefault(opt.gameConfig);
    this.playerConfigs = opt.playerConfigs;
    this.io = opt.io;
    this._stateLog.push({
      state: this.state,
      canResume: false,
    });
    this.initPlayerCards(0);
    this.initPlayerCards(1);
  }

  get stateLog() {
    return this._stateLog;
  }
  get detailLog() {
    return this.logger.getLogs();
  }

  protected mutate(mutation: Mutation) {
    if (!this._terminated) {
      super.mutate(mutation);
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

  /** 初始化玩家的角色牌和牌堆 */
  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = this.state.data.characters.get(ch);
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

  private notifyOneImpl(who: 0 | 1, opt: InternalNotifyOption) {
    const player = this.io.players[who];
    const stateMutations = opt.stateMutations
      .map((m) => exposeMutation(who, m))
      .filter((em): em is ExposedMutation => !!em);
    player.notify({
      mutations: [...stateMutations, ...opt.exposedMutations],
      newState: exposeState(who, opt.state),
    });
  }
  private notifyOne(who: 0 | 1, mutation?: ExposedMutation, state?: GameState) {
    this.notifyOneImpl(who, {
      state: state ?? this.state,
      canResume: false,
      stateMutations: [],
      exposedMutations: mutation ? [mutation] : [],
    });
  }
  /** @internal */
  override async onNotify(opt: InternalNotifyOption) {
    if (this._terminated) {
      return;
    }
    for (const i of [0, 1] as const) {
      this.notifyOneImpl(i, opt);
    }
  }
  /** @internal */
  override async onPause(opt: InternalPauseOption) {
    if (this._terminated) {
      return;
    }
    const { state, canResume, stateMutations } = opt;
    this._stateLog.push({
      state,
      canResume,
    });
    await this.io.pause?.(this.state, [...stateMutations]);
    if (this.state.phase === "gameEnd") {
      this.gotWinner(this.state.winner);
    } else {
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
    if (this.finishResolvers !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    this.finishResolvers = Promise.withResolvers();
    this.logger.clearLogs();
    (async () => {
      try {
        await this.notifyAndPause({ canResume: true });
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
          await this.notifyAndPause({ canResume: true });
        }
      } catch (e) {
        if (e instanceof GiTcgIOError) {
          this.io.onIoError?.(e);
          await this.gotWinner(flip(e.who));
        } else if (e instanceof GiTcgError) {
          this.finishResolvers?.reject(e);
        } else {
          let message = String(e);
          if (e instanceof Error) {
            message = e.message;
            if (e.stack) {
              message += "\n" + e.stack;
            }
          }
          this.finishResolvers?.reject(
            new GiTcgCoreInternalError(`Unexpected error: ` + message),
          );
        }
      }
    })();
    return this.finishResolvers.promise;
  }

  async startFromState(state: GameState) {
    if (this.finishResolvers !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    this._state = state;
    return this.start();
  }

  async startWithStateLog(log: readonly GameStateLogEntry[]) {
    if (this.finishResolvers !== null) {
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
    this._state = allLogs.pop()!.state;
    this._stateLog = allLogs;
    return this.start();
  }

  /** 胜负已定，切换到 gameEnd 阶段 */
  private async gotWinner(winner: 0 | 1 | null) {
    if (this.state.phase !== "gameEnd") {
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
      await this.notifyAndPause();
    }
    this.finishResolvers?.resolve(winner);
    if (!this._terminated) {
      this._terminated = true;
      Object.freeze(this);
    }
  }
  /** 强制终止游戏，不再进行额外改动 */
  terminate() {
    this.finishResolvers?.reject(
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
    using l = this.subLog(DetailLogType.Phase, `In initHands phase:`);
    for (let who of [0, 1] as const) {
      for (let i = 0; i < this.config.initialHands; i++) {
        this.drawCard(who);
      }
    }
    this.notifyAndPause();
    await Promise.all([this.switchCard(0), this.switchCard(1)]);
    this.mutate({
      type: "changePhase",
      newPhase: "initActives",
    });
  }

  private async initActives() {
    using l = this.subLog(DetailLogType.Phase, `In initActive phase:`);
    const [a0, a1] = await Promise.all([
      this.chooseActive(0),
      this.chooseActive(1),
    ]);
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
    await this.handleEvent("onBattleBegin", new EventArg(this.state));
  }

  /** @internal */
  async chooseActive(who: 0 | 1, state = this.state): Promise<CharacterState> {
    const player = state.players[who];
    this.notifyOne(
      flip(who),
      {
        type: "oppChoosingActive",
      },
      state,
    );
    const candidates = player.characters.filter(
      (ch) => ch.variables.alive && ch.id !== player.activeCharacterId,
    );
    if (candidates.length === 0) {
      throw new GiTcgCoreInternalError(
        `No available candidate active character for player ${who}.`,
      );
    }
    const { active } = await this.rpc(who, "chooseActive", {
      candidates: candidates.map((c) => c.id),
    });
    return getEntityById(state, active, true) as CharacterState;
  }

  private async rollPhase() {
    using l = this.subLog(
      DetailLogType.Phase,
      `In roll phase (round ${this.state.roundNumber}+1):`,
    );
    this.mutate({
      type: "stepRound",
    });
    await this.handleEvent("onRoundBegin", new EventArg(this.state));
    if (this.state.roundNumber >= this.config.maxRounds) {
      this.gotWinner(null);
    }
    // onRoll event
    interface RollParams {
      fixed: readonly DiceType[];
      count: number;
    }
    const rollParams: RollParams[] = [];
    for (const who of [0, 1] as const) {
      const rollModifier = new ModifyRollEventArg(this.state, who);
      await this.handleEvent("modifyRoll", rollModifier);
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
    await this.handleEvent("onActionPhase", new EventArg(this.state));
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
      using l = this.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}) (replaced action):`,
      );
      await this.executeSkill(replaceAction, new EventArg(this.state));
      this.mutate({
        type: "switchTurn",
      });
    } else {
      using l = this.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
      );
      await this.handleEvent(
        "onBeforeAction",
        new PlayerEventArg(this.state, who),
      );
      const actions = await this.availableAction();
      this.notifyOne(flip(who), {
        type: "oppAction",
      });
      const { chosenIndex, cost } = await this.rpc(who, "action", {
        candidates: actions.map(exposeAction),
      });
      if (chosenIndex < 0 || chosenIndex >= actions.length) {
        throw new GiTcgIOError(who, `User chosen index out of range`);
      }
      const actionInfo = actions[chosenIndex];
      await this.handleEvent("modifyAction", actionInfo.eventArg);

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
          await this.executeSkill(actionInfo.skill);
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
          // 应用“禁用事件牌”效果
          if (
            player().combatStatuses.find((st) =>
              st.definition.tags.includes("disableEvent"),
            ) &&
            actionInfo.card.definition.type === "event"
          ) {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: actionInfo.card,
              used: false,
            });
          } else {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: actionInfo.card,
              used: true,
            });
            await this.executeSkill(
              {
                caller: activeCh(),
                definition: actionInfo.card.definition.onPlay,
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
            type: "removeCard",
            who,
            where: "hands",
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
      await this.handleEvent(
        "onAction",
        new ActionEventArg(this.state, actionInfo),
      );
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
    using l = this.subLog(
      DetailLogType.Phase,
      `In end phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
    );
    await this.handleEvent("onEndPhase", new EventArg(this.state));
    for (const who of [0, 1] as const) {
      for (let i = 0; i < 2; i++) {
        this.drawCard(who);
      }
    }
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
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
  }

  async availableAction(): Promise<ActionInfoWithModification[]> {
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
        const previewState = await SkillExecutor.previewSkill(
          this.state,
          skillInfo,
        );
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
        definition: card.definition.onPlay,
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
            cost: [...card.definition.onPlay.requiredCost],
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
          who,
          from: activeCh,
          to: ch,
          fromReaction: false,
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
        .filter((c) => !c.definition.tags.includes("noTuning"))
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
    const resultAfterModification: ActionInfoWithModification[] = [];
    for (const actionInfo of result) {
      // eventArg1 为预计算，只应用 ActionInfo 的副作用
      // eventArg2 行动后使用，然后传入 handleEvent 使其真正发生
      const eventArg1 = new ModifyActionEventArg(this.state, actionInfo);
      const eventArg2 = new ModifyActionEventArg(this.state, actionInfo);
      await SkillExecutor.previewEvent(this.state, "modifyAction", eventArg1);
      resultAfterModification.push({
        ...eventArg1.action,
        eventArg: eventArg2,
      });
    }
    return resultAfterModification;
  }

  /** @internal */
  async switchCard(who: 0 | 1) {
    const player = () => this._state.players[who];
    const { removedHands } = await this.rpc(who, "switchHands", {});
    // swapIn: 从手牌到牌堆
    // swapOut: 从牌堆到手牌
    const count = removedHands.length;
    const swapInCards = removedHands.map((id) => {
      const card = player().hands.find((c) => c.id === id);
      if (typeof card === "undefined") {
        throw new GiTcgDataError(`Unknown card id ${id}`);
      }
      return card;
    });
    const swapInCardIds = swapInCards.map((c) => c.definition.id);

    for (const card of swapInCards) {
      const mutation: Mutation = {
        type: "stepRandom",
        value: -1,
      };
      this.mutate(mutation);
      const index = mutation.value % (player().piles.length + 1);
      this.mutate({
        type: "transferCard",
        path: "handsToPiles",
        who,
        value: card,
        targetIndex: index,
      });
    }
    // 如果牌堆顶的手牌是刚刚换入的同名牌，那么暂时不选它
    let topIndex = 0;
    for (let i = 0; i < count; i++) {
      let candidate: CardState;
      while (
        topIndex < player().piles.length &&
        swapInCardIds.includes(player().piles[topIndex].definition.id)
      ) {
        topIndex++;
      }
      if (topIndex >= player().piles.length) {
        // 已经跳过了所有同名牌，只能从头开始
        candidate = player().piles[0];
      } else {
        candidate = player().piles[topIndex];
      }
      this.mutate({
        type: "transferCard",
        path: "pilesToHands",
        who,
        value: candidate,
      });
    }
    this.notify();
  }

  /** @internal */
  async reroll(who: 0 | 1, times: number) {
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
    this.notify({
      mutations: [
        {
          type: "switchActive",
          who,
          id: to.id,
          definitionId: to.definition.id,
          via: null,
        },
      ],
    });
    await this.handleEvent(
      "onSwitchActive",
      new SwitchActiveEventArg(oldState, {
        type: "switchActive",
        who,
        from,
        to,
        fromReaction: false,
      }),
    );
  }

  private async executeSkill(skillInfo: SkillInfo, arg: GeneralSkillArg) {
    this._state = await SkillExecutor.executeSkill(this, skillInfo, arg);
  }
  private async handleEvent(...args: EventAndRequest) {
    this._state = await SkillExecutor.handleEvent(this, ...args);
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
