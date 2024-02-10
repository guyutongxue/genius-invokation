import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  useContext,
  splitProps,
  Show,
  For,
  ComponentProps,
  Accessor,
} from "solid-js";
import type {
  DiceType,
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  NotificationMessage,
  PlayerData,
  RerollDiceResponse,
  StateData,
  SwitchHandsResponse,
  PlayCardAction,
  DamageData,
} from "@gi-tcg/typings";
import type { PlayerIO } from "@gi-tcg/core";

import { PlayerArea } from "./PlayerArea";
import { DiceSelect, DiceSelectProps } from "./DiceSelect";
import { createWaitNotify } from ".";
import { createStore } from "solid-js/store";
import { groupBy } from "./utils";
import { RerollView } from "./RerollView";
import { Dice } from "./Dice";
import { SwitchHandsView } from "./SwitchHandsView";
import { SkillButton } from "./SkillButton";

const EMPTY_PLAYER_DATA: PlayerData = {
  activeCharacterId: 0,
  dice: [],
  piles: [],
  hands: [],
  characters: [],
  combatStatuses: [],
  summons: [],
  supports: [],
  skills: [],
  declaredEnd: false,
  legendUsed: false,
};

const EMPTY_STATE_DATA: StateData = {
  currentTurn: 0,
  phase: "initHands",
  roundNumber: 0,
  winner: null,
  players: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

/** 点击“结束回合”的行为 ID */
export const DECLARE_END_ID = 0;
/**  将卡牌作为元素调和素材时的点击行为 ID*/
export const ELEMENTAL_TUNING_OFFSET = -11072100;

interface PCAWithIndex extends PlayCardAction {
  index: number;
}
type PartialDiceSelectProp = Omit<DiceSelectProps, "value">;
type DiceAndSelectionState = PartialDiceSelectProp & {
  /** 是否可以进行骰子选择并确认（若置空需设置 DiceSelectProp.disableConfirm） */
  actionIndex?: number;
  clickable?: Map<number, DiceAndSelectionState>;
  selected: number[];
};

/**
 * 构建单个卡牌的状态转移图
 * @param selected 标记为“已选择”的实体列表
 * @param actions 待处理的事件列表
 * @returns
 */
function oneCardState(
  selected: number[],
  actions: PCAWithIndex[],
): DiceAndSelectionState {
  switch (actions[0].targets.length) {
    case 0: {
      return {
        actionIndex: actions[0].index,
        required: actions[0].cost,
        selected,
      };
    }
    case 1: {
      const clickable = new Map<number, DiceAndSelectionState>();
      const root: DiceAndSelectionState = {
        disableConfirm: true,
        clickable,
        selected,
      };
      for (const a of actions) {
        clickable.set(a.targets[0], {
          clickable,
          actionIndex: a.index,
          required: a.cost,
          selected: [...selected, a.targets[0]],
        });
      }
      return root;
    }
    default: {
      const groupByFirst = groupBy(actions, (a) => a.targets[0]);
      const clickable = new Map<number, DiceAndSelectionState>();
      for (const [k, v] of groupByFirst) {
        const newV = v.map((v) => ({
          ...v,
          targets: v.targets.toSpliced(0, 1),
        }));
        clickable.set(k, oneCardState([...selected, k], newV));
      }
      return {
        disableConfirm: true,
        clickable,
        selected,
      };
    }
  }
}

/**
 * 构建所有使用卡牌的“可点击”状态转移图
 * @param cardAction 所有使用卡牌的事件
 * @returns 状态转移图的初始状态结点
 */
function buildAllCardClickState(
  cardAction: PCAWithIndex[],
): Map<number, DiceAndSelectionState> {
  const grouped = groupBy(cardAction, (v) => v.card);
  const result = new Map<number, DiceAndSelectionState>();
  for (const [k, v] of grouped) {
    result.set(k, oneCardState([k], v));
  }
  console.log(result);
  return result;
}

export interface PlayerContextValue {
  allClickable: readonly number[];
  allSelected: readonly number[];
  allCosts: Readonly<Record<number, readonly DiceType[]>>;
  allDamages: readonly DamageData[];
  focusing: Accessor<number | null>;
  onClick: (id: number) => void;
  setPrepareTuning: (value: boolean) => void;
  assetApiEndpoint: string;
}

export interface AgentActions {
  onNotify?: (msg: NotificationMessage) => void;
  onSwitchHands: () => Promise<SwitchHandsResponse>;
  onChooseActive: (req: ChooseActiveRequest) => Promise<ChooseActiveResponse>;
  onRerollDice: () => Promise<RerollDiceResponse>;
  onAction: (req: ActionRequest) => Promise<ActionResponse>;
}

const PlayerContext = createContext<PlayerContextValue>();
export function usePlayerContext(): Readonly<PlayerContextValue> {
  return useContext(PlayerContext)!;
}

export interface WebUiOption {
  onGiveUp?: () => void;
  alternativeAction?: AgentActions;
  assetApiEndpoint?: string;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

// Remove proxy
function sanitize<T>(value: T): T{
  return JSON.parse(JSON.stringify(value));
}

export function createPlayer(
  who: 0 | 1,
  { onGiveUp, alternativeAction, assetApiEndpoint }: WebUiOption = {},
): [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
] {
  const [stateData, setStateData] = createSignal(EMPTY_STATE_DATA);
  const [giveUp, setGiveUp] = createSignal(false);
  const [rerolling, waitReroll, notifyRerolled] = createWaitNotify<number[]>();
  const [handSwitching, waitHandSwitch, notifyHandSwitched] =
    createWaitNotify<number[]>();
  const [, waitDiceSelect, notifyDiceSelected] = createWaitNotify<
    DiceType[] | undefined
  >();
  const [diceSelectProp, setDiceSelectProp] =
    createSignal<PartialDiceSelectProp>();

  const [allClickable, setClickable] = createStore<number[]>([]);
  const [allSelected, setSelected] = createStore<number[]>([]);
  const [allDamages, setAllDamages] = createStore<DamageData[]>([]);
  const [focusing, setFocusing] = createSignal<number | null>(null);
  const [, waitElementClick, notifyElementClicked] = createWaitNotify<number>();

  const [allCosts, setAllCosts] = createStore<
    Record<number, readonly DiceType[]>
  >({});
  const [prepareTuning, setPrepareTuning] = createSignal(false);

  const clearIo = () => {
    setClickable([]);
    setSelected([]);
    setAllCosts({});
    setDiceSelectProp();
  };
  let rejectRpc: (e: Error) => void = () => {
    clearIo();
  };

  const action = alternativeAction ?? {
    onSwitchHands: async () => {
      return { removedHands: await waitHandSwitch() };
    },
    onRerollDice: async () => {
      return { rerollIndexes: await waitReroll() };
    },
    onChooseActive: async ({ candidates }) => {
      let active = candidates[0];
      setClickable([...candidates]);
      setDiceSelectProp({
        confirmOnly: true,
        disableConfirm: true,
      });
      const nextProp: PartialDiceSelectProp = {
        confirmOnly: true,
      };
      for (;;) {
        const result = await Promise.race([
          waitElementClick(),
          waitDiceSelect(),
        ]);
        if (Array.isArray(result)) {
          // 点击了确认
          break;
        }
        if (typeof result === "number") {
          // 点击了角色
          active = result;
          setSelected([active]);
        }
        setDiceSelectProp(nextProp);
      }
      setDiceSelectProp();
      setClickable([]);
      setSelected([]);
      return { active };
    },
    onAction: async ({ candidates }) => {
      const player = myPlayer();
      const currentEnergy =
        player.characters.find((ch) => ch.id === player.activeCharacterId)
          ?.energy ?? 0;
      const playCardInfos: PCAWithIndex[] = [];
      const initialClickable = new Map<number, DiceAndSelectionState>();
      const newAllCosts: Record<number, readonly DiceType[]> = {};
      for (const [action, i] of candidates.map((v, i) => [v, i] as const)) {
        if (
          "cost" in action &&
          action.cost.filter((d) => d === 9 /* energy */).length > currentEnergy
        ) {
          // If energy does not meet the requirement, disable it.
          continue;
        }
        switch (action.type) {
          case "useSkill": {
            initialClickable.set(action.skill, {
              actionIndex: i,
              required: action.cost,
              selected: [],
            });
            newAllCosts[action.skill] = action.cost;
            break;
          }
          case "playCard": {
            playCardInfos.push({ ...action, index: i });
            newAllCosts[action.card] = action.cost;
            break;
          }
          case "switchActive": {
            initialClickable.set(action.active, {
              actionIndex: i,
              required: action.cost,
              selected: [action.active],
            });
            newAllCosts[action.active] = action.cost;
            break;
          }
          case "elementalTuning": {
            initialClickable.set(
              action.discardedCard + ELEMENTAL_TUNING_OFFSET,
              {
                actionIndex: i,
                disabledDice: [8 /* omni */, action.target],
                required: [0 /* void */],
                selected: [action.discardedCard],
              },
            );
            break;
          }
          case "declareEnd": {
            initialClickable.set(0, {
              actionIndex: i,
              required: [],
              selected: [],
            });
          }
        }
      }
      for (const [k, v] of buildAllCardClickState(playCardInfos)) {
        initialClickable.set(k, v);
      }
      setAllCosts(newAllCosts);

      let result: ActionResponse;
      let state: DiceAndSelectionState = {
        clickable: initialClickable,
        selected: [],
      };
      for (;;) {
        while (!("actionIndex" in state)) {
          setClickable([...(state.clickable?.keys() ?? [])]);
          setSelected([...state.selected]);
          const val = await waitElementClick();
          if (!state.clickable?.has(val)) {
            throw new Error(`Click event emitted with an invalid value`);
          }
          state = state.clickable.get(val)!;
        }
        setClickable([...(state.clickable?.keys() ?? [])]);
        setSelected([...state.selected]);
        const chosenIndex = state.actionIndex!;

        if (candidates[chosenIndex].type === "declareEnd") {
          setClickable([]);
          setSelected([]);
          result = {
            chosenIndex,
            cost: [],
          };
          break;
        }

        setDiceSelectProp(state);
        const r = await Promise.race([waitDiceSelect(), waitElementClick()]);
        if (Array.isArray(r) || typeof r === "undefined") {
          setDiceSelectProp();
          if (Array.isArray(r)) {
            result = {
              chosenIndex,
              cost: r,
            };
            break;
          }
          state = {
            clickable: initialClickable,
            selected: [],
          };
        } else {
          state = state.clickable!.get(r)!;
        }
      }
      setClickable([]);
      setSelected([]);
      setAllCosts({});
      return result;
    },
  };
  const io: PlayerIOWithCancellation = {
    giveUp: false,
    notify: (msg) => {
      setStateData(msg.newState);
      let currentFocusing: number | null = null;
      const currentDamages: DamageData[] = [];
      for (const event of msg.events) {
        if (event.type === "damage") {
          currentDamages.push(event.damage);
        }
        if (event.type === "triggered") {
          currentFocusing = event.id;
        }
      }
      setAllDamages(currentDamages);
      setFocusing(currentFocusing);
      if (action.onNotify) {
        action.onNotify(msg);
      }
    },
    rpc: (method, req) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return new Promise<any>((resolve, reject) => {
        rejectRpc = (e) => {
          clearIo();
          reject(e);
        };
        switch (method) {
          case "switchHands":
            action
              .onSwitchHands()
              .then(sanitize)
              .then(resolve)
              .catch(reject);
            break;
          case "chooseActive":
            action
              .onChooseActive(req as ChooseActiveRequest)
              .then(sanitize)
              .then(resolve)
              .catch(reject);
            break;
          case "rerollDice":
            action
              .onRerollDice()
              .then(sanitize)
              .then(resolve)
              .catch(reject);
            break;
          case "action":
            action
              .onAction(req as ActionRequest)
              .then(sanitize)
              .then(resolve)
              .catch(reject);
            break;
          default:
            reject("Unknown method");
        }
      });
    },
    cancelRpc: () => {
      rejectRpc(new Error("User canceled the request"));
    },
  };
  createEffect(() => {
    if (giveUp()) {
      io.giveUp = true;
      onGiveUp?.();
      rejectRpc(new Error("User give up when rpc"));
    }
  });

  const myPlayer = () => stateData().players[who];

  const tuningDragEnter = (e: DragEvent) => {
    e.preventDefault();
  };
  const tuningDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };
  const tuningDragLeave = (e: DragEvent) => {
    e.preventDefault();
  };
  const tuningDrop = (e: DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer!.getData("text/plain");
    const cardId = parseInt(data);
    notifyElementClicked(cardId + ELEMENTAL_TUNING_OFFSET);
    setPrepareTuning(false);
  };
  const contextValue: PlayerContextValue = {
    allClickable,
    allSelected,
    allCosts,
    allDamages,
    focusing,
    onClick: notifyElementClicked,
    setPrepareTuning,
    assetApiEndpoint:
      assetApiEndpoint ?? "https://gi-tcg-assets.guyutongxue.site/api",
  };

  function Chessboard(props: ComponentProps<"div">) {
    const [local, restProps] = splitProps(props, ["class"]);
    return (
      <div
        class={`gi-tcg-chessboard relative flex flex-col ${local.class} select-none`}
        {...restProps}
      >
        <PlayerContext.Provider value={contextValue}>
          <div class="w-full b-solid b-black b-2 relative">
            <PlayerArea data={stateData().players[1 - who]} opp={true} />
            <PlayerArea data={stateData().players[who]} opp={false} />
          </div>
          <div class="absolute left-0 top-[50%] translate-y-[-50%]">
            <div class="absolute left-5 top--2 translate-y-[-100%] translate-x-[-50%]">
              <Dice
                type={8 /* omni */}
                text={`${stateData().players[1 - who].dice.length}`}
                size={32}
              />
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-20 h-20 rounded-10 flex flex-col items-center justify-center border-8 border-solid border-yellow-800"
                classList={{
                  "bg-yellow-300": stateData().currentTurn === who,
                  "bg-blue-200": stateData().currentTurn !== who,
                }}
              >
                <div class="text-lg">{stateData().roundNumber}</div>
                <div class="text-sm text-gray">{stateData().phase}</div>
              </div>
              <Show when={allClickable.includes(DECLARE_END_ID)}>
                <button
                  class="btn btn-green-500"
                  v-if="clickable.includes(DECLARE_END_ID)"
                  onClick={() => notifyElementClicked(DECLARE_END_ID)}
                >
                  结束回合
                </button>
              </Show>
            </div>
          </div>
          <div class="absolute right-0 top-0 z-15 h-full min-w-8 flex flex-col bg-yellow-800">
            <Show
              when={diceSelectProp()}
              fallback={
                <For each={myPlayer().dice}>{(d) => <Dice type={d} />}</For>
              }
            >
              <DiceSelect
                {...diceSelectProp()}
                value={myPlayer().dice}
                onConfirm={notifyDiceSelected}
                onCancel={() => notifyDiceSelected(void 0)}
              />
            </Show>
          </div>
          <div class="absolute right-10 bottom-0 z-5 flex flex-row gap-2">
            <For each={myPlayer().skills}>
              {(skill) => <SkillButton data={skill} />}
            </For>
          </div>
          <div
            class="absolute right-0 top-0 h-full z-15 opacity-80 items-center justify-center bg-yellow-300 flex flex-col transition-all"
            classList={{
              invisible: !prepareTuning(),
              "w-0": !prepareTuning(),
              "w-40": prepareTuning(),
            }}
            onDragEnter={tuningDragEnter}
            onDragOver={tuningDragOver}
            onDragLeave={tuningDragLeave}
            onDrop={tuningDrop}
          >
            <span>拖动到此处</span>
            <span>以元素调和</span>
          </div>
          <Show when={rerolling()}>
            <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 z-20">
              <RerollView dice={myPlayer().dice} onConfirm={notifyRerolled} />
            </div>
          </Show>
          <Show when={handSwitching()}>
            <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 z-20">
              <SwitchHandsView
                hands={myPlayer().hands}
                onConfirm={notifyHandSwitched}
              />
            </div>
          </Show>
          <button
            class="absolute right-10 top-2 z-15 btn btn-red-500"
            onClick={() => setGiveUp(true)}
            disabled={giveUp()}
          >
            {giveUp() ? "已放弃对局" : "走此小道"}
          </button>
          <Show when={stateData().phase === "gameEnd"}>
            <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 text-white text-15 z-20 flex items-center justify-center">
              {stateData().winner === who ? "胜利" : "失败"}
            </div>
          </Show>
        </PlayerContext.Provider>
      </div>
    );
  }

  return [io, Chessboard];
}
