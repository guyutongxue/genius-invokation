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
  onMount,
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
  ExposedMutation,
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
import { cached } from "./fetch";
import { AsyncQueue } from "./async_queue";

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

export const EMPTY_STATE_DATA: StateData = {
  currentTurn: 0,
  phase: "initHands",
  roundNumber: 0,
  winner: null,
  players: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

/** 点击“宣布结束”的行为 ID */
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
  return result;
}

export interface AgentActions {
  onNotify?: (msg: NotificationMessage) => void;
  onSwitchHands: () => Promise<SwitchHandsResponse>;
  onChooseActive: (req: ChooseActiveRequest) => Promise<ChooseActiveResponse>;
  onRerollDice: () => Promise<RerollDiceResponse>;
  onAction: (req: ActionRequest) => Promise<ActionResponse>;
}

export interface PlayerContextValue {
  readonly allClickable: readonly number[];
  readonly allSelected: readonly number[];
  readonly allCosts: Readonly<Record<number, readonly DiceType[]>>;
  readonly onClick: (id: number) => void;
  readonly setPrepareTuning: (value: boolean) => void;
  readonly assetApiEndpoint: Accessor<string>;
  readonly assetAltText: (id: number) => string | undefined;
}

export interface EventContextValue {
  readonly allDamages: Accessor<readonly DamageData[]>;
  readonly focusing: Accessor<number | null>;
}

const PlayerContext = createContext<PlayerContextValue>();
export function usePlayerContext(): Readonly<PlayerContextValue> {
  return useContext(PlayerContext)!;
}
const EventContext = createContext<EventContextValue>();
export function useEventContext(): Readonly<EventContextValue> {
  return useContext(EventContext)!;
}

export interface WebUiOption {
  onGiveUp?: () => void;
  alternativeAction?: AgentActions;
  assetApiEndpoint?: string;
  assetAltText?: (id: number) => string;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

// Remove proxy
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function createPlayer(
  who: 0 | 1,
  opt: WebUiOption = {},
): [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
] {
  const [stateData, setStateData] = createSignal(EMPTY_STATE_DATA);
  const [previewStateData, setPreviewStateData] = createSignal<StateData>();
  const [previewing, setPreviewing] = createSignal(false);
  const [mutations, setMutations] = createSignal<ExposedMutation[]>([]);
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
  const [, waitElementClick, notifyElementClicked] = createWaitNotify<number>();
  const [, waitChessboardClick, notifyChessboardClicked] =
    createWaitNotify<void>();

  const [allCosts, setAllCosts] = createStore<
    Record<number, readonly DiceType[]>
  >({});
  const [prepareTuning, setPrepareTuning] = createSignal(false);

  const clearIo = () => {
    setClickable([]);
    setSelected([]);
    setAllCosts({});
    setDiceSelectProp();
    notifyHandSwitched([]);
    notifyDiceSelected([]);
    notifyRerolled([]);
    notifyElementClicked(0);
  };
  let rejectRpc: (e: Error) => void = () => {
    clearIo();
  };

  const action = opt.alternativeAction ?? {
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
          const val = await Promise.race([
            waitElementClick(),
            waitChessboardClick(),
          ]);
          if (typeof val === "undefined") {
            state = {
              clickable: initialClickable,
              selected: [],
            };
          } else {
            if (!state.clickable?.has(val)) {
              throw new Error(`Click event emitted with an invalid value`);
            }
            state = state.clickable.get(val)!;
          }
        }
        setClickable([...(state.clickable?.keys() ?? [])]);
        setSelected([...state.selected]);
        const chosenIndex = state.actionIndex!;
        setPreviewStateData(candidates[chosenIndex].preview);

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
        const r = await Promise.race([
          waitDiceSelect(),
          waitElementClick(),
          waitChessboardClick(),
        ]);
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
      setPreviewStateData();
      return result;
    },
  };
  const renderQueue = new AsyncQueue();
  const io: PlayerIOWithCancellation = {
    giveUp: false,
    notify: (msg) => {
      renderQueue.push(async () => {
        setStateData(msg.newState);
        setMutations(msg.mutations);
        if (action.onNotify) {
          action.onNotify(msg);
        }
        if (import.meta.env.DEV && who === 0) {
          console.log(msg);
        }
        if (
          msg.mutations.filter((mut) =>
            ["damage", "triggered"].includes(mut.type),
          ).length > 0
        ) {
          if (!import.meta.env.DEV) {
            console.log(msg.mutations);
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
        }
      });
    },
    rpc: async (method, req) => {
      await renderQueue.push(async () => {});
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return new Promise<any>((resolve, reject) => {
        rejectRpc = (e) => {
          reject(e);
          clearIo();
        };
        switch (method) {
          case "switchHands":
            action.onSwitchHands().then(sanitize).then(resolve).catch(reject);
            break;
          case "chooseActive":
            action
              .onChooseActive(req as ChooseActiveRequest)
              .then(sanitize)
              .then(resolve)
              .catch(reject);
            break;
          case "rerollDice":
            action.onRerollDice().then(sanitize).then(resolve).catch(reject);
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
      opt.onGiveUp?.();
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
  const assetApiEndpoint = () =>
    opt.assetApiEndpoint ?? "https://gi-tcg-assets.guyutongxue.site/api/v2";
  const playerContextValue: PlayerContextValue = {
    allClickable,
    allSelected,
    allCosts,
    onClick: notifyElementClicked,
    setPrepareTuning,
    assetApiEndpoint,
    assetAltText: (id) => opt.assetAltText?.(id),
  };

  const ChessboardWithIO = () => (
    <PlayerContext.Provider value={playerContextValue}>
      <Chessboard
        stateData={(previewing() && previewStateData()) || stateData()}
        who={who}
        mutations={mutations()}
        previewing={previewing()}
        onClick={() => notifyChessboardClicked()}
      >
        <Show when={allClickable.includes(DECLARE_END_ID)}>
          <button
            class="absolute left-22 top-[50%] translate-y-[-50%] btn btn-green-500 z-10"
            v-if="clickable.includes(DECLARE_END_ID)"
            onClick={() => notifyElementClicked(DECLARE_END_ID)}
          >
            结束回合
          </button>
        </Show>
        <div class="absolute right-0 top-0 z-15 h-full min-w-8 flex flex-col items-center bg-yellow-800">
          <Show
            when={diceSelectProp()}
            fallback={
              <>
                <div class="rounded-full bg-white w-6 h-6 my-2 line-height-1em flex items-center justify-center">
                  {myPlayer().dice.length}
                </div>
                <For each={myPlayer().dice}>{(d) => <Dice type={d} />}</For>
              </>
            }
          >
            <DiceSelect
              {...diceSelectProp()}
              value={myPlayer().dice}
              onConfirm={notifyDiceSelected}
              onCancel={() => notifyDiceSelected(void 0)}
              onEnterPreview={() => previewStateData() && setPreviewing(true)}
              onLeavePreview={() => setPreviewing(false)}
            />
          </Show>
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
          class="absolute left-2 top-2 z-15 btn btn-red-500"
          onClick={() => setGiveUp(true)}
          disabled={io.giveUp}
        >
          {io.giveUp ? "已放弃对局" : "走此小道"}
        </button>
      </Chessboard>
    </PlayerContext.Provider>
  );

  return [io, ChessboardWithIO];
}

interface ChessboardProps extends ComponentProps<"div"> {
  stateData: StateData;
  mutations?: readonly ExposedMutation[];
  who: 0 | 1;
  children?: JSX.Element;
  previewing?: boolean;
  onClick?: (e: MouseEvent) => void;
}

function Chessboard(props: ChessboardProps) {
  const { assetApiEndpoint } = usePlayerContext();
  const [local, restProps] = splitProps(props, [
    "class",
    "stateData",
    "mutations",
    "who",
    "children",
  ]);

  const [allDamages, setAllDamages] = createSignal<DamageData[]>([]);
  const [focusing, setFocusing] = createSignal<number | null>(null);

  createEffect(() => {
    let currentFocusing: number | null = null;
    const currentDamages: DamageData[] = [];
    for (const event of local.mutations ?? []) {
      if (event.type === "damage") {
        currentDamages.push(event.damage);
      }
      if (event.type === "triggered") {
        currentFocusing = event.id;
      }
    }
    setAllDamages(currentDamages);
    setFocusing(currentFocusing);
  });

  onMount(() => {
    const prefetchedImages = [1, 2, 3, 4, 5, 6, 7];
    prefetchedImages.map((id) =>
      cached(`${assetApiEndpoint()}/images/${id}?thumb=1`),
    );
  });

  return (
    <EventContext.Provider value={{ allDamages, focusing }}>
      <div
        class={`gi-tcg-chessboard relative flex flex-col ${
          local.class ?? ""
        } select-none`}
        {...restProps}
      >
        <div
          data-previewing={props.previewing}
          onClick={(e) => props.onClick?.(e)}
          class="w-full b-solid b-black b-2 relative data-[previewing=true]:grayscale-50"
        >
          <PlayerArea
            data={local.stateData.players[1 - local.who]}
            opp={true}
          />
          <PlayerArea data={local.stateData.players[local.who]} opp={false} />
        </div>
        <div class="absolute left-0 top-[50%] translate-y-[-50%] z-10">
          <div class="absolute left-5 top--2 translate-y-[-100%] translate-x-[-50%]">
            <Dice
              type={8 /* omni */}
              text={`${local.stateData.players[1 - local.who].dice.length}`}
              size={32}
            />
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-20 h-20 rounded-10 flex flex-col items-center justify-center border-8 border-solid border-yellow-800"
              classList={{
                "bg-yellow-300": local.stateData.currentTurn === local.who,
                "bg-blue-200": local.stateData.currentTurn !== local.who,
              }}
            >
              <div class="text-lg">{local.stateData.roundNumber}</div>
              <div class="text-sm text-gray">{local.stateData.phase}</div>
            </div>
          </div>
        </div>
        <div class="absolute right-10 bottom-0 z-12 flex flex-row gap-2">
          <For each={local.stateData.players[local.who].skills}>
            {(skill) => <SkillButton data={skill} />}
          </For>
        </div>
        {local.children}
        <Show when={local.stateData.phase === "gameEnd"}>
          <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 text-white text-15 z-20 flex items-center justify-center">
            {local.stateData.winner === local.who ? "胜利" : "失败"}
          </div>
        </Show>
      </div>
    </EventContext.Provider>
  );
}

export interface StandaloneChessboardProps extends ChessboardProps {
  assetApiEndpoint?: string;
  assetAltText?: (id: number) => string;
}

export function StandaloneChessboard(props: StandaloneChessboardProps) {
  const [local, restProps] = splitProps(props, [
    "assetApiEndpoint",
    "assetAltText",
  ]);

  const contextValue = (): PlayerContextValue => ({
    allClickable: [],
    allCosts: [],
    allSelected: [],
    assetApiEndpoint: () =>
      local.assetApiEndpoint ?? "https://gi-tcg-assets.guyutongxue.site/api",
    assetAltText: (id) => local.assetAltText?.(id),
    onClick: () => {},
    setPrepareTuning: () => {},
  });

  return (
    <PlayerContext.Provider value={contextValue()}>
      <Chessboard {...restProps}>
        <div class="absolute right-0 top-0 z-15 h-full min-w-8 flex flex-col bg-yellow-800">
          <For each={restProps.stateData.players[restProps.who].dice}>
            {(d) => <Dice type={d} />}
          </For>
        </div>
      </Chessboard>
    </PlayerContext.Provider>
  );
}
