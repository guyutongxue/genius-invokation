import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  useContext,
  Accessor,
} from "solid-js";
import type {
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
): [PlayerIO, JSX.Element] {
  const [stateData, setStateData] = createSignal(EMPTY_STATE_DATA);
  const [giveUp, setGiveUp] = createSignal(false);
  const action = alternativeAction ?? {
    onNotify: () => {},
    onSwitchHands: async () => {
      return { removedHands: [] };
    },
    onRerollDice: async () => {
      return { rerollIndexes: [] };
    },
    onChooseActive: async ({ candidates }) => {
      return { active: candidates[0] };
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

  const [allClickable, setClickable] = createSignal<number[]>([]);
  const [allSelected, setSelected] = createSignal<number[]>([]);
  const onClick = (id: number) => {
    // if (clickable.includes(id)) {
    //   setSelected([id]);
    // }
    // TODO
  };

  const chessboard = (
    <div class="gi-tcg-chessboard flex flex-col">
      <PlayerContext.Provider
        value={{
          allClickable,
          allSelected,
          onClick,
        }}
      >
        <PlayerArea data={stateData().players[1 - who]} opp={true} />
        <PlayerArea data={stateData().players[who]} opp={false} />
      </PlayerContext.Provider>
    </div>
  );

  return [io, chessboard];
}
