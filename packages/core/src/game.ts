import minstd from "@stdlib/random-base-minstd";
import { checkDice, flip } from "@gi-tcg/utils";

import {
  CharacterState,
  GameConfig,
  GameState,
  PlayerState,
} from "./base/state";
import { Mutation, StepRandomM, applyMutation } from "./base/mutation";
import { GameIO, exposeAction, exposeMutation, exposeState } from "./io";
import {
  Aura,
  DamageEvent,
  DiceType,
  ElementalReactionEvent,
  Event,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  verifyRpcRequest,
  verifyRpcResponse,
} from "@gi-tcg/typings";
import {
  allEntities,
  drawCard,
  elementOfCharacter,
  getActiveCharacterIndex,
  getEntityById,
  shiftLeft,
  shuffle,
  sortDice,
} from "./util";
import { ReadonlyDataStore } from "./builder/registry";
import {
  ActionInfo,
  DamageInfo,
  DefeatedModifierImpl,
  DeferredAction,
  ElementalTuningInfo,
  PlayCardInfo,
  ReactionInfo,
  RollModifierImpl,
  SkillDefinitionBase,
  SkillInfo,
  SwitchActiveInfo,
  UseDiceModifierImpl,
  UseSkillInfo,
  useSyncSkill,
} from "./base/skill";
import { SkillContext } from "./builder/context";
import { CardDefinition, CardTarget, CardTargetKind } from "./base/card";

export interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
  readonly noShuffle?: boolean;
  readonly alwaysOmni?: boolean;
}

const INITIAL_ID = -500000;

type ActionInfoWithNewState = ActionInfo & { newState: GameState };

class Game {
  private _state: GameState;
  get state() {
    return this._state;
  }

  constructor(
    private readonly data: ReadonlyDataStore,
    private readonly config: GameConfig,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig],
    private readonly io: GameIO,
  ) {
    const initRandomState = minstd.factory({
      seed: config.randomSeed,
    }).state;
    this._state = {
      data,
      config,
      iterators: {
        random: initRandomState,
        id: INITIAL_ID,
      },
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 0,
      skillLog: [],
      mutationLog: [],
      winner: null,
      players: [this.initPlayerState(0), this.initPlayerState(1)],
    };
    this.initPlayerCards(0);
    this.initPlayerCards(1);
  }

  private mutate(mutation: Mutation) {
    this._state = applyMutation(this._state, mutation);
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
      const def = this.data.card.get(id);
      if (typeof def === "undefined") {
        throw new Error(`Unknown card id ${id}`);
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
      canCharged: false,
      hasDefeated: false,
      legendUsed: false,
      skipNextTurn: false,
    };
  }
  /** 初始化玩家的角色牌和牌堆 */
  private initPlayerCards(who: 0 | 1) {
    const config = this.playerConfigs[who];
    for (const ch of config.characters) {
      const def = this.data.character.get(ch);
      if (typeof def === "undefined") {
        throw new Error(`Unknown character id ${ch}`);
      }
      this.mutate({
        type: "createCharacter",
        who,
        value: {
          id: 0,
          definition: def,
          variables: def.constants,
          entities: [],
        },
      });
    }
    for (const card of this._state.players[who].initialPiles) {
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

  private notify(events: Event[]) {
    for (const i of [0, 1] as const) {
      this.notifyOne(i, events);
    }
    this.mutate({ type: "clearMutationLog" });
  }
  private notifyOne(who: 0 | 1, events: Event[]) {
    const player = this.io.players[who];
    player.notify({
      events,
      mutations: this.state.mutationLog.flatMap((m) => {
        const ex = exposeMutation(who, m.mutation);
        return ex ? [ex] : [];
      }),
      newState: exposeState(who, this.state),
    });
  }

  async start() {
    this.notify([]);
    while (this._state.phase !== "gameEnd") {
      await this.io.pause(this._state);
      switch (this._state.phase) {
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
          const _check: never = this._state.phase;
          break;
      }
      if (this._state.mutationLog.length > 1) {
        this.notify([]);
      }
    }
  }

  private async rpc<M extends RpcMethod>(
    who: 0 | 1,
    method: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[M]> {
    verifyRpcRequest(method, req);
    const resp = await this.io.players[who].rpc(method, req);
    verifyRpcResponse(method, resp);
    return resp;
  }

  private async initHands() {
    for (let who of [0, 1] as const) {
      for (let i = 0; i < this.config.initialHands; i++) {
        this._state = drawCard(this._state, who, null);
      }
    }
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
        return getEntityById(this._state, active, true) as CharacterState;
      }),
    );
    await this.switchActive(0, a0);
    await this.switchActive(1, a1);
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
  }

  private async rollPhase() {
    // onRoll event
    interface RollParams {
      fixed: readonly DiceType[];
      count: number;
    }
    const rollParams: RollParams[] = [];
    for (const who of [0, 1] as const) {
      const rollModifier = new RollModifierImpl(who);
      this._state = useSyncSkill(this._state, "onRoll", (st) => {
        rollModifier.setCaller(st);
        return rollModifier;
      });
      console.log(`Player ${who} roll modifier: ${rollModifier._log}`);
      rollParams.push({
        fixed: rollModifier._fixedDice,
        count: 1 + rollModifier._extraRerollCount,
      });
    }

    await Promise.all(
      ([0, 1] as const).map(async (who) => {
        const { fixed, count } = rollParams[who];
        const initDice = sortDice(this._state.players[who], [
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
        this.notify([]);
        await this.reroll(who, count);
      }),
    );
    this.mutate({
      type: "stepRound",
    });
    // Change to action phase:
    // - do `changePhase`
    // - clean `hasDefeated`
    // - clean `declaredEnd`
    // - do `cleanSkillLog`
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
    this.mutate({
      type: "clearSkillLog",
    });
    await this.handleEvents([
      "onActionPhase",
      {
        state: this._state,
      },
    ]);
    // @ts-expect-error
    window.$$ = (arg: any) => {
      return new SkillContext(this._state, {
        caller: this._state.players[0].characters[0],
        fromCard: null,
        definition: { id: 0 } as any,
        requestBy: null,
      })
        .$$(arg)
        .map((x) => x.state);
    };
  }
  private async actionPhase() {
    const who = this._state.currentTurn;
    let player = this._state.players[who];
    if (player.declaredEnd) {
      this.mutate({
        type: "switchTurn",
      });
    } else if (player.skipNextTurn) {
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "skipNextTurn",
        value: false,
      });
      this.mutate({
        type: "switchTurn",
      });
    } else {
      const actions = this.availableAction();
      console.log(actions);
      this.notifyOne(flip(who), [
        {
          type: "oppAction",
        },
      ]);
      const { chosenIndex, cost } = await this.rpc(who, "action", {
        candidates: actions.map(exposeAction),
      });
      if (chosenIndex < 0 || chosenIndex >= actions.length) {
        throw new Error(`User chosen index out of range`);
      }
      const actionInfo = actions[chosenIndex];
      this._state = actionInfo.newState;
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "canCharged",
        value: player.dice.length % 2 === 0,
      });

      const activeCh = player.characters[getActiveCharacterIndex(player)];
      // 检查骰子
      if (!checkDice(actionInfo.cost, cost)) {
        throw new Error(`Selected dice doesn't meet requirement`);
      }
      if (
        actionInfo.type === "elementalTuning" &&
        (cost[0] === DiceType.Omni || cost[0] === actionInfo.result)
      ) {
        throw new Error(
          `Elemental tunning cannot use omni dice or active character's element`,
        );
      }
      // 消耗骰子
      const operatingDice = [...player.dice];
      for (const consumed of cost) {
        if (consumed === DiceType.Energy) {
        } else {
          const idx = operatingDice.indexOf(consumed);
          if (idx === -1) {
            throw new Error(`Selected dice (${consumed}) not found in player`);
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
      if (requiredEnergy > 0) {
        if (activeCh.variables.energy < requiredEnergy) {
          throw new Error(`Active character does not have enough energy`);
        }
        this.mutate({
          type: "modifyEntityVar",
          state: activeCh,
          varName: "energy",
          value: activeCh.variables.energy - requiredEnergy,
        });
      }

      player = this._state.players[who];
      switch (actionInfo.type) {
        case "useSkill":
          await this.useSkill(actionInfo.skill, void 0);
          break;
        case "playCard":
          this.mutate({
            type: "disposeCard",
            who,
            oldState: actionInfo.card,
            used: true,
          });
          if (actionInfo.card.definition.tags.includes("legend")) {
            this.mutate({
              type: "setPlayerFlag",
              who,
              flagName: "legendUsed",
              value: true,
            });
          }
          await this.useSkill(
            {
              caller: activeCh,
              definition: actionInfo.card.definition.skillDefinition,
              fromCard: actionInfo.card,
              requestBy: null,
            },
            actionInfo.target,
          );
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
            value: sortDice(player, [
              ...player.dice,
              elementOfCharacter(activeCh.definition),
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
      await this.handleEvents([
        "onAction",
        {
          ...actionInfo,
          state: actionInfo.newState,
        },
      ]);
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "canPlunging",
        value: actionInfo.type === "switchActive",
      });
    }
    if (
      this._state.players[0].declaredEnd &&
      this._state.players[1].declaredEnd
    ) {
      this.mutate({
        type: "changePhase",
        newPhase: "end",
      });
    }
  }
  private async endPhase() {
    await this.handleEvents([
      "onEndPhase",
      {
        state: this._state,
      },
    ]);
    for (const who of [0, 1] as const) {
      for (let i = 0; i < 2; i++) {
        this._state = drawCard(this._state, who, null);
      }
    }
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
  }

  private availableAction(): ActionInfoWithNewState[] {
    const who = this._state.currentTurn;
    const player = this._state.players[who];
    const activeCh = player.characters[getActiveCharacterIndex(player)];
    const result: ActionInfo[] = [];

    // Skills
    if (
      activeCh.entities.find(
        (e) =>
          e.definition.type === "status" &&
          e.definition.tags.includes("disableSkill"),
      )
    ) {
      // Use skill is disabled, skip
    } else {
      result.push(
        ...activeCh.definition.initiativeSkills
          .map<UseSkillInfo>((s) => ({
            type: "useSkill",
            who,
            skill: {
              caller: activeCh,
              definition: s,
              fromCard: null,
              requestBy: null,
            },
          }))
          .map((s) => ({
            ...s,
            fast: false,
            cost: [...s.skill.definition.requiredCost],
          })),
      );
    }

    // Cards
    for (const card of player.hands) {
      let allTargets: CardTarget[];
      const skillInfo: SkillInfo = {
        caller: activeCh,
        definition: card.definition.skillDefinition,
        fromCard: card,
        requestBy: null,
      };
      // 当支援区满时，卡牌目标为“要离场的支援牌”
      if (
        card.definition.type === "support" &&
        player.supports.length === this._state.config.maxSupports
      ) {
        allTargets = player.supports.map((s) => ({ ids: [s.id] }));
      } else {
        allTargets = (0, card.definition.getTarget)(this._state, skillInfo);
      }
      for (const { ids } of allTargets) {
        if ((0, card.definition.filter)(this._state, skillInfo, { ids })) {
          result.push({
            type: "playCard",
            who,
            card,
            target: { ids },
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
    return result.map((actionInfo) => {
      const diceModifier = new UseDiceModifierImpl(actionInfo);
      const newState = useSyncSkill(this._state, "onBeforeUseDice", (st) => {
        diceModifier.setCaller(st);
        return diceModifier;
      });
      const newActionInfo = diceModifier.currentAction;
      console.log(newActionInfo.log);
      return {
        ...newActionInfo,
        newState,
      };
    });
  }

  private async useSkill(
    skillInfo: SkillInfo,
    arg: any,
  ): Promise<DeferredAction[]> {
    // If caller not exists (consumed by previous skills), do nothing
    try {
      getEntityById(this._state, skillInfo.caller.id, true);
    } catch {
      return [];
    }
    const skillDef = skillInfo.definition;
    // If skill has a filter and not passed, do nothing
    // 在 arg.state 上做检查，即引发事件的时刻的全局状态，而非现在时刻的状态
    const stateToApplyFilter: GameState = arg?.state ?? this._state;
    if (
      "filter" in skillDef &&
      !(0, skillDef.filter)(stateToApplyFilter, skillInfo, arg)
    ) {
      return [];
    }
    this.mutate({ type: "pushSkillLog", skillInfo });
    const oldState = this._state;
    const [newState, eventList] = (0, skillDef.action)(
      this._state,
      skillInfo,
      arg,
    );
    this._state = newState;
    if (oldState.players !== newState.players) {
      this.notify([
        {
          type: "triggered",
          id: skillInfo.caller.id,
        },
        // Damages
        ...eventList
          .filter(([n]) => n === "onDamage")
          .map<DamageEvent>(([_, arg]) => {
            const a = arg as DamageInfo;
            return {
              type: "damage",
              damage: {
                type: a.type,
                value: a.value,
                target: a.target.id,
                log: "log" in arg ? (arg.log as string) : "",
              },
            };
          }),
        // Element reactions
        ...eventList
          .filter(([n]) => n === "onElementalReaction")
          .map<ElementalReactionEvent>(([_, arg]) => {
            const a = arg as ReactionInfo;
            return {
              type: "elementalReaction",
              on: a.target.id,
              reactionType: a.type,
            };
          }),
      ]);
      await this.io.pause(this._state);
      const hasDefeated = await this.checkDefeated();
      if (hasDefeated) {
        this.notify([]);
        await this.io.pause(this._state);
      }
    }
    await this.handleEvents(["onSkill", { ...skillInfo, state: oldState }]);
    return eventList;
  }

  private async switchCard(who: 0 | 1) {
    this.notify([]);
    const { removedHands } = await this.rpc(who, "switchHands", {});
    const cardStates = removedHands.map((id) => {
      const card = this._state.players[who].hands.find((c) => c.id === id);
      if (typeof card === "undefined") {
        throw new Error(`Unknown card id ${id}`);
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
      this._state = drawCard(this._state, who, null);
    }
    this.notify([]);
  }
  private async reroll(who: 0 | 1, times: number) {
    for (let i = 0; i < times; i++) {
      const dice = this._state.players[who].dice;
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
        value: sortDice(this._state.players[who], [
          ...controlled,
          ...this.randomDice(rerollIndexes.length),
        ]),
      });
      this.notify([]);
    }
  }

  private async switchActive(who: 0 | 1, to: CharacterState) {
    const from = this._state.players[who].characters.find(
      (ch) => ch.id === this._state.players[who].activeCharacterId,
    );
    const oldState = this._state;
    this.mutate({
      type: "switchActive",
      who,
      value: to,
    });
    if (typeof from !== "undefined") {
      await this.handleEvents([
        "onSwitchActive",
        {
          type: "switchActive",
          who,
          from,
          to,
          state: oldState,
        },
      ]);
    }
  }

  private async *doHandleEvents(
    actions: DeferredAction[],
  ): AsyncGenerator<DeferredAction[], void> {
    for (const [name, arg] of actions) {
      if (name === "requestReroll") {
        await this.reroll(arg.who, arg.times);
      } else if (name === "requestSwitchCards") {
        await this.switchCard(arg.who);
      } else if (name === "requestUseSkill") {
        const def = this.data.skill.get(arg.requestingSkillId);
        if (typeof def === "undefined") {
          throw new Error(`Unknown skill id ${arg.requestingSkillId}`);
        }
        if (def.triggerOn !== null) {
          throw new Error(`Cannot request skill with trigger event`);
        }
        const skillInfo: SkillInfo = {
          caller: arg.via.caller,
          definition: def,
          fromCard: null,
          requestBy: arg.via,
        };
        yield this.useSkill(skillInfo, void 0);
      } else {
        const { state: onTimeState } = arg;
        const currentTurn = onTimeState.currentTurn;
        for (const who of [currentTurn, flip(currentTurn)]) {
          const player = onTimeState.players[who];
          const activeIdx = getActiveCharacterIndex(player);
          for (const ch of shiftLeft(player.characters, activeIdx)) {
            for (const sk of ch.definition.skills) {
              if (sk.triggerOn === name) {
                const skillInfo: SkillInfo = {
                  caller: ch,
                  definition: sk,
                  fromCard: null,
                  requestBy: null,
                };
                yield this.useSkill(skillInfo, arg);
              }
            }
            for (const et of ch.entities) {
              for (const sk of et.definition.skills) {
                if (sk.triggerOn === name) {
                  const skillInfo: SkillInfo = {
                    caller: et,
                    definition: sk,
                    fromCard: null,
                    requestBy: null,
                  };
                  yield this.useSkill(skillInfo, arg);
                }
              }
            }
          }
          for (const key of [
            "combatStatuses",
            "summons",
            "supports",
          ] as const) {
            for (const et of player[key]) {
              for (const sk of et.definition.skills) {
                if (sk.triggerOn === name) {
                  const skillInfo: SkillInfo = {
                    caller: et,
                    definition: sk,
                    fromCard: null,
                    requestBy: null,
                  };
                  yield this.useSkill(skillInfo, arg);
                }
              }
            }
          }
        }
      }
    }
  }

  // 检查倒下角色，若有返回 `true`
  private async checkDefeated(): Promise<boolean> {
    const currentTurn = this._state.currentTurn;
    // 指示双方出战角色是否倒下，若有则 await（等待用户操作）
    const activeDefeated: (Promise<CharacterState> | null)[] = [null, null];
    const hasDefeated: [boolean, boolean] = [false, false];
    for (const who of [currentTurn, flip(currentTurn)]) {
      const player = this._state.players[who];
      const activeIdx = getActiveCharacterIndex(player);
      for (const ch of shiftLeft(player.characters, activeIdx)) {
        if (ch.variables.alive && ch.variables.health <= 0) {
          const defeatedModifier = new DefeatedModifierImpl(ch);
          this._state = useSyncSkill(this._state, "onBeforeDefeated", (st) => {
            defeatedModifier.setCaller(st);
            return defeatedModifier;
          });
          if (defeatedModifier._immune) {
            continue;
          }
          let mut: Mutation = {
            type: "modifyEntityVar",
            state: ch,
            varName: "alive",
            value: 0,
          };
          this.mutate(mut);
          // 清空角色装备与状态、元素附着、能量
          for (const et of ch.entities) {
            this.mutate({
              type: "disposeEntity",
              oldState: et,
            });
          }
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
          hasDefeated[who] = true;
          // 如果出战角色倒下，那么令用户选择新的出战角色
          if (ch.id === player.activeCharacterId) {
            this.notifyOne(flip(who), [
              {
                type: "oppChoosingActive",
              },
            ]);
            activeDefeated[who] = this.rpc(who, "chooseActive", {
              candidates: this._state.players[who].characters
                .filter((c) => c.variables.alive)
                .map((c) => c.id),
            }).then(({ active }) => {
              return getEntityById(this._state, active, true) as CharacterState;
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
    const [a0, a1] = await Promise.all(activeDefeated);
    if (a0 !== null) {
      await this.switchActive(0, a0);
    }
    if (a1 !== null) {
      await this.switchActive(1, a1);
    }
    return hasDefeated[0] !== null || hasDefeated[1] !== null;
  }

  private async handleEvents(...actions: DeferredAction[]) {
    for await (const events of this.doHandleEvents(actions)) {
      await this.handleEvents(...events);
    }
  }
}

export interface StartOption {
  data: ReadonlyDataStore;
  gameConfig?: GameConfig;
  playerConfigs: [PlayerConfig, PlayerConfig];
  io: GameIO;
}

export async function startGame(opt: StartOption): Promise<0 | 1 | null> {
  const game = new Game(
    opt.data,
    opt.gameConfig ?? {
      initialDice: 8,
      initialHands: 5,
      maxDice: 16,
      maxHands: 10,
      maxRounds: 15,
      maxSummons: 4,
      maxSupports: 4,
      randomSeed: Math.floor(Math.random() * 21474836) + 1,
    },
    opt.playerConfigs,
    opt.io,
  );
  await game.start();
  return game.state.winner;
}
