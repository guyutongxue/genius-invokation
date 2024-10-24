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
import { Mutation } from "./base/mutation";
import { GameIO, exposeAction, exposeMutation, exposeState } from "./io";
import {
  elementOfCharacter,
  getActiveCharacterIndex,
  findReplaceAction,
  shuffle,
  sortDice,
  isSkillDisabled,
  initiativeSkillsOfPlayer,
  getEntityArea,
  playSkillOfCard,
} from "./utils";
import { GameData } from "./builder/registry";
import {
  ActionEventArg,
  ActionInfo,
  DisposeOrTuneCardEventArg,
  DrawCardEventArg,
  ElementalTuningInfo,
  EventAndRequest,
  EventArg,
  ModifyRollEventArg,
  PlayCardEventArg,
  PlayerEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  SwitchActiveInfo,
  UseSkillEventArg,
  InitiativeSkillEventArg,
  defineSkillInfo,
} from "./base/skill";
import { CardDefinition } from "./base/card";
import { executeQueryOnState } from "./query";
import {
  GiTcgCoreInternalError,
  GiTcgDataError,
  GiTcgError,
  GiTcgIOError,
} from "./error";
import { DetailLogType, DetailLogger } from "./log";
import { randomSeed } from "./random";
import { GeneralSkillArg, SkillExecutor } from "./skill_executor";
import {
  InternalNotifyOption,
  InternalPauseOption,
  MutatorConfig,
  StateMutator,
} from "./mutator";
import { ActionInfoWithModification, ActionPreviewer } from "./preview";
import { Version } from "./base/version";

type Resolvers<T> = ReturnType<typeof Promise.withResolvers<T>>;

export interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

const INITIAL_ID = -500000;

/** 获取玩家初始状态，主要是初始化“起始牌堆” */
function initPlayerState(
  data: GameData,
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
    canCharged: false,
    canPlunging: false,
    hasDefeated: false,
    legendUsed: false,
    skipNextTurn: false,
    roundSkillLog: new Map(),
    removedEntities: [],
  };
}

export class Game {
  private readonly config: GameConfig;
  private readonly playerConfigs: readonly [PlayerConfig, PlayerConfig];
  private readonly io: GameIO;
  private readonly logger: DetailLogger;

  private _terminated = false;
  private finishResolvers: Resolvers<0 | 1 | null> | null = null;
  private readonly mutator: StateMutator;
  public readonly mutatorConfig: MutatorConfig;

  constructor(opt: GameOption) {
    const config = mergeGameConfigWithDefault(opt.gameConfig);
    const extensions = opt.data.extensions
      .values()
      .map<ExtensionState>((v) => ({
        definition: v,
        state: v.initialState,
      }))
      .toArray();
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
    this.logger = new DetailLogger();
    this.mutatorConfig = {
      logger: this.logger,
      onNotify: (opt) => this.onNotify(opt),
      onPause: (opt) => this.onPause(opt),
      howToChooseActive: (who, chs) => this.rpcChooseActive(who, chs),
      howToReroll: (who) => this.rpcReroll(who),
      howToSwitchHands: (who) => this.rpcSwitchHands(who),
      howToSelectCard: (who, cards) => this.rpcSelectCard(who, cards),
    };
    this.mutator = new StateMutator(initialState, this.mutatorConfig);
    this.config = mergeGameConfigWithDefault(opt.gameConfig);
    this.playerConfigs = opt.playerConfigs;
    this.io = opt.io;
    this.initPlayerCards(0);
    this.initPlayerCards(1);
  }

  get gameVersion(): Version {
    return this.state.data.version;
  }

  get detailLog() {
    return this.logger.getLogs();
  }

  get state() {
    return this.mutator.state;
  }

  mutate(mutation: Mutation) {
    if (!this._terminated) {
      this.mutator.mutate(mutation);
    }
  }

  query(who: 0 | 1, query: string): AnyState[] {
    return executeQueryOnState(this.state, who, query);
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
          variables: {},
        },
        target: "piles",
      });
    }
  }

  // private lastNotifiedState: [string, string] = ["", ""];
  private notifyOneImpl(who: 0 | 1, opt: InternalNotifyOption) {
    const player = this.io.players[who];
    const stateMutations = opt.stateMutations
      .map((m) => exposeMutation(who, m))
      .filter((em): em is ExposedMutation => !!em);
    const newState = exposeState(who, opt.state);
    const mutations = [...stateMutations, ...opt.exposedMutations];
    // const newStateStr = JSON.stringify(newState);
    // if (mutations.length > 0 || newStateStr !== this.lastNotifiedState[who]) {
    player.notify({ mutations, newState });
    // this.lastNotifiedState[who] = newStateStr;
    // }
  }
  private notifyOne(who: 0 | 1, mutation?: ExposedMutation, state?: GameState) {
    this.notifyOneImpl(who, {
      state: state ?? this.state,
      canResume: false,
      stateMutations: [],
      exposedMutations: mutation ? [mutation] : [],
    });
  }

  private async onNotify(opt: InternalNotifyOption) {
    if (this._terminated) {
      return;
    }
    for (const i of [0, 1] as const) {
      this.notifyOneImpl(i, opt);
    }
  }
  private async onPause(opt: InternalPauseOption) {
    if (this._terminated) {
      return;
    }
    const { state, canResume, stateMutations } = opt;
    await this.io.pause?.(state, [...stateMutations], canResume);
    if (state.phase === "gameEnd") {
      this.gotWinner(state.winner);
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
        await this.mutator.notifyAndPause({ force: true, canResume: true });
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
          this.mutate({ type: "clearRemovedEntities" });
          await this.mutator.notifyAndPause({ canResume: true });
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
    this.mutator.resetState(state);
    return this.start();
  }

  giveUp(who: 0 | 1) {
    this.gotWinner(flip(who));
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
      await this.mutator.notifyAndPause();
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
    }
  }

  private async initHands() {
    using l = this.mutator.subLog(DetailLogType.Phase, `In initHands phase:`);
    for (let who of [0, 1] as const) {
      for (let i = 0; i < this.config.initialHands; i++) {
        this.mutator.drawCard(who);
      }
    }
    this.mutator.notifyAndPause();
    await Promise.all([
      this.mutator.switchHands(0),
      this.mutator.switchHands(1),
    ]);
    this.mutate({
      type: "changePhase",
      newPhase: "initActives",
    });
  }

  private async initActives() {
    using l = this.mutator.subLog(DetailLogType.Phase, `In initActive phase:`);
    const [a0, a1] = await Promise.all([
      this.mutator.chooseActive(0),
      this.mutator.chooseActive(1),
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
    await this.handleEvent("onBattleBegin", new EventArg(this.state));
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
    this.mutate({
      type: "stepRound",
    });
  }

  /** @internal */
  async rpcChooseActive(
    who: 0 | 1,
    candidates: readonly number[],
  ): Promise<number> {
    // this.notifyOne(
    //   flip(who),
    //   {
    //     type: "oppChoosingActive",
    //   },
    //   state,
    // );
    const { active } = await this.rpc(who, "chooseActive", {
      candidates,
    });
    if (!candidates.includes(active)) {
      throw new GiTcgIOError(who, `Invalid active character id ${active}`);
    }
    return active;
  }

  private async rollPhase() {
    using l = this.mutator.subLog(
      DetailLogType.Phase,
      `In roll phase (round ${this.state.roundNumber}):`,
    );
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
          ...this.mutator.randomDice(
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
        await this.mutator.reroll(who, count);
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
    this.mutate({
      type: "setPlayerFlag",
      who,
      flagName: "canCharged",
      value: player().dice.length % 2 === 0,
    });
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
      using l = this.mutator.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}) (replaced action):`,
      );
      await this.executeSkill(replaceAction, new EventArg(this.state));
      this.mutate({
        type: "switchTurn",
      });
    } else {
      using l = this.mutator.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
      );
      await this.handleEvent(
        "onBeforeAction",
        new PlayerEventArg(this.state, who),
      );
      const actions = await this.availableActions();
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
      await this.handleEvent("modifyAction0", actionInfo.eventArg);
      await this.handleEvent("modifyAction1", actionInfo.eventArg);
      await this.handleEvent("modifyAction2", actionInfo.eventArg);
      await this.handleEvent("modifyAction3", actionInfo.eventArg);

      // 检查骰子
      if (!checkDice(actionInfo.cost, cost)) {
        throw new GiTcgIOError(who, `Selected dice doesn't meet requirement`);
      }
      if (
        !this.state.config.allowTuningAnyDice &&
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
        case "useSkill": {
          const callerArea = getEntityArea(this.state, activeCh().id);
          await this.handleEvent(
            "onBeforeUseSkill",
            new UseSkillEventArg(this.state, callerArea, actionInfo.skill),
          );
          await this.executeSkill(actionInfo.skill, {
            targets: actionInfo.targets,
          });
          await this.handleEvent(
            "onUseSkill",
            new UseSkillEventArg(this.state, callerArea, actionInfo.skill),
          );
          break;
        }
        case "playCard": {
          const card = actionInfo.skill.caller;
          if (card.definition.tags.includes("legend")) {
            this.mutate({
              type: "setPlayerFlag",
              who,
              flagName: "legendUsed",
              value: true,
            });
          }
          await this.handleEvent(
            "onBeforePlayCard",
            new PlayCardEventArg(this.state, actionInfo),
          );
          // 应用“禁用事件牌”效果
          if (
            player().combatStatuses.find((st) =>
              st.definition.tags.includes("disableEvent"),
            ) &&
            card.definition.cardType === "event"
          ) {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: card,
              reason: "disabled",
            });
          } else {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: card,
              reason: "play",
            });
            await this.executeSkill(actionInfo.skill, {
              targets: actionInfo.targets,
            });
          }
          await this.handleEvent(
            "onPlayCard",
            new PlayCardEventArg(this.state, actionInfo),
          );
          break;
        }
        case "switchActive": {
          await this.switchActive(who, actionInfo.to);
          break;
        }
        case "elementalTuning": {
          const tuneCardEventArg = new DisposeOrTuneCardEventArg(
            this.state,
            actionInfo.card,
            "elementalTuning",
          );
          this.mutate({
            type: "removeCard",
            who,
            where: "hands",
            oldState: actionInfo.card,
            reason: "elementalTuning",
          });
          this.mutate({
            type: "resetDice",
            who,
            value: sortDice(player(), [
              ...player().dice,
              elementOfCharacter(activeCh().definition),
            ]),
          });
          await this.handleEvent("onDisposeOrTuneCard", tuneCardEventArg);
          break;
        }
        case "declareEnd": {
          this.mutate({
            type: "setPlayerFlag",
            who,
            flagName: "declaredEnd",
            value: true,
          });
          break;
        }
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
    using l = this.mutator.subLog(
      DetailLogType.Phase,
      `In end phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
    );
    await this.handleEvent("onEndPhase", new EventArg(this.state));
    for (const who of [0, 1] as const) {
      const cards: CardState[] = [];
      for (let i = 0; i < 2; i++) {
        const card = this.mutator.drawCard(who);
        if (card) {
          cards.push(card);
        }
      }
      for (const card of cards) {
        await this.handleEvent(
          "onDrawCard",
          new DrawCardEventArg(this.state, who, card),
        );
      }
    }
    await this.handleEvent("onRoundEnd", new EventArg(this.state));
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
      type: "clearRoundSkillLog",
      who: 0,
    });
    this.mutate({
      type: "clearRoundSkillLog",
      who: 1,
    });
    this.mutate({
      type: "stepRound",
    });
    if (this.state.roundNumber >= this.config.maxRounds) {
      this.gotWinner(null);
    } else {
      this.mutate({
        type: "changePhase",
        newPhase: "roll",
      });
    }
  }

  async availableActions(): Promise<ActionInfoWithModification[]> {
    const who = this.state.currentTurn;
    const player = this.state.players[who];
    const activeCh = player.characters[getActiveCharacterIndex(player)];
    const result: ActionInfo[] = [];

    // Skills
    if (isSkillDisabled(activeCh)) {
      // Use skill is disabled, skip
    } else {
      for (const { caller, skill } of initiativeSkillsOfPlayer(player)) {
        const skillType = skill.initiativeSkillConfig.skillType;
        const charged = skillType === "normal" && player.canCharged;
        const plunging =
          skillType === "normal" &&
          (player.canPlunging ||
            activeCh.entities.some((et) =>
              et.definition.tags.includes("normalAsPlunging"),
            ));
        const skillInfo = defineSkillInfo({
          caller,
          definition: skill,
          charged,
          plunging,
        });
        const allTargets = (0, skill.initiativeSkillConfig.getTarget)(
          this.state,
          skillInfo,
        );
        for (const arg of allTargets) {
          if (!(0, skill.filter)(this.state, skillInfo, arg)) {
            continue;
          }
          const actionInfo: ActionInfo = {
            type: "useSkill",
            who,
            skill: skillInfo,
            targets: arg.targets,
            fast: false,
            cost: [...skill.initiativeSkillConfig.requiredCost],
          };
          result.push(actionInfo);
        }
      }
    }

    // Cards
    for (const card of player.hands) {
      let allTargets: InitiativeSkillEventArg[];
      const skillDef = playSkillOfCard(card.definition);
      const skillInfo = defineSkillInfo({
        caller: card,
        definition: skillDef,
      });
      // 当支援区满时，卡牌目标为“要离场的支援牌”
      if (
        card.definition.cardType === "support" &&
        player.supports.length === this.state.config.maxSupports
      ) {
        allTargets = player.supports.map((st) => ({ targets: [st] }));
      } else {
        allTargets = (0, skillDef.initiativeSkillConfig.getTarget)(
          this.state,
          skillInfo,
        );
      }
      for (const arg of allTargets) {
        if ((0, skillDef.filter)(this.state, skillInfo, arg)) {
          const actionInfo: ActionInfo = {
            type: "playCard",
            who,
            skill: skillInfo,
            targets: arg.targets,
            cost: [...skillDef.initiativeSkillConfig.requiredCost],
            fast: !card.definition.tags.includes("action"),
          };
          result.push(actionInfo);
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
    // Add preview and apply modifyAction
    const previewer = new ActionPreviewer(this.state, who);
    return await Promise.all(result.map((a) => previewer.modifyAndPreview(a)));
  }

  private async rpcSwitchHands(who: 0 | 1) {
    const { removedHands } = await this.rpc(who, "switchHands", {});
    return removedHands;
  }

  private async rpcReroll(who: 0 | 1) {
    const { rerollIndexes } = await this.rpc(who, "rerollDice", {});
    return rerollIndexes;
  }

  private async rpcSelectCard(who: 0 | 1, cards: readonly number[]) {
    const { selected } = await this.rpc(who, "selectCard", { cards });
    if (!cards.includes(selected)) {
      throw new GiTcgIOError(who, `Selected card not in candidates`);
    }
    return selected;
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
    this.mutator.notify({
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
    this.mutator.notify();
    this.mutator.resetState(
      await SkillExecutor.executeSkill(this, skillInfo, arg),
    );
  }
  private async handleEvent(...args: EventAndRequest) {
    this.mutator.notify();
    this.mutator.resetState(await SkillExecutor.handleEvent(this, ...args));
  }
}

export interface GameOption {
  readonly data: GameData;
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
    allowTuningAnyDice: false,
    ...JSON.parse(JSON.stringify(config ?? {})),
  };
}
