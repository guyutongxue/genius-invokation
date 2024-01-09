import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  useContext,
  Accessor,
  splitProps,
  Show,
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
} from "@gi-tcg/typings";
import type { PlayerIO } from "@gi-tcg/core";

import { PlayerArea } from "./PlayerArea";
import { DiceSelect, DiceSelectProps } from "./DiceSelect";
import { createWaitNotify } from ".";

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

export interface PlayerContextValue {
  allClickable: Accessor<number[]>;
  allSelected: Accessor<number[]>;
  onClick: (id: number) => void;
}

export interface AgentActions {
  onNotify?: (msg: NotificationMessage) => void;
  onSwitchHands: () => Promise<SwitchHandsResponse>;
  onChooseActive: (req: ChooseActiveRequest) => Promise<ChooseActiveResponse>;
  onRerollDice: () => Promise<RerollDiceResponse>;
  onAction: (req: ActionRequest) => Promise<ActionResponse>;
}

const PlayerContext = createContext<PlayerContextValue>();
export function usePlayerContext(): PlayerContextValue {
  return useContext(PlayerContext)!;
}

export function createPlayer(
  who: 0 | 1,
  alternativeAction?: AgentActions,
): [
  io: PlayerIO,
  Chessboard: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element,
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
    createSignal<Omit<DiceSelectProps, "value">>();

  const [allClickable, setClickable] = createSignal<number[]>([]);
  const [allSelected, setSelected] = createSignal<number[]>([]);
  const [, waitElementClick, notifyElementClicked] = createWaitNotify<number>();

  const action = alternativeAction ?? {
    onNotify: () => {},
    onSwitchHands: async () => {
      return { removedHands: [] };
    },
    onRerollDice: async () => {
      return { rerollIndexes: [] };
    },
    onChooseActive: async ({ candidates }) => {
      let active = candidates[0];
      setClickable([...candidates]);
      setDiceSelectProp({
        confirmOnly: true,
        disableConfirm: true,
      });
      const nextProp = {
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
    onAction: async () => {
      throw new Error("Not implemented");
    },
  };
  const io: PlayerIO = {
    giveUp: false,
    notify: (msg) => {
      setStateData(msg.newState);
      if (action.onNotify) {
        action.onNotify(msg);
      }
    },
    /* eslint-disable @typescript-eslint/no-explicit-any */
    rpc: async (method, req): Promise<any> => {
      switch (method) {
        case "switchHands":
          return action.onSwitchHands();
        case "chooseActive":
          return action.onChooseActive(req as ChooseActiveRequest);
        case "rerollDice":
          return action.onRerollDice();
        case "action":
          return action.onAction(req as ActionRequest);
        default:
          throw new Error("Unknown method");
      }
    },
  };
  createEffect(() => {
    if (giveUp()) {
      io.giveUp = true;
    }
  });

  const myDice = () => stateData().players[who];

  function Chessboard(props: JSX.HTMLAttributes<HTMLDivElement>) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
      <div
        class={`gi-tcg-chessboard relative flex flex-col ${local.class}`}
        {...rest}
      >
        <PlayerContext.Provider
          value={{
            allClickable,
            allSelected,
            onClick: notifyElementClicked,
          }}
        >
          <div class="w-full b-solid b-black b-2 relative select-none">
            <PlayerArea data={stateData().players[1 - who]} opp={true} />
            <PlayerArea data={stateData().players[who]} opp={false} />
          </div>
          <Show when={diceSelectProp()}>
            {(props) => (
              <div class="absolute right-0 top-0 h-full min-w-8 flex flex-col bg-yellow-800">
                <DiceSelect
                  {...props()}
                  value={myDice().dice}
                  onConfirm={notifyDiceSelected}
                  onCancel={() => notifyDiceSelected(void 0)}
                />
              </div>
            )}
          </Show>
        </PlayerContext.Provider>
      </div>
    );
  }

  return [io, Chessboard];
}
