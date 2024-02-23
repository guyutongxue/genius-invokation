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

import data from "@gi-tcg/data";
import {
  Game,
  GameIO,
  GameStateLogEntry,
  PlayerConfig,
  deserializeGameStateLog,
  exposeState,
  serializeGameStateLog,
} from "@gi-tcg/core";

import {
  StandaloneChessboard,
  createPlayer,
  PlayerIOWithCancellation,
} from "@gi-tcg/webui-core";
import "@gi-tcg/webui-core/style.css";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { decode } from "@gi-tcg/utils";
import { Child } from "./Child";

function getPlayerConfig(shareCode: string): PlayerConfig {
  return decode(shareCode);
}

export function App() {
  if (window.opener !== null) {
    // eslint-disable-next-line solid/components-return-once
    return <Child />;
  }

  const [started, setStarted] = createSignal(false);
  const [deck0, setDeck0] = createSignal(
    "AVCg3jUPA0Bw9ZUPCVCw9qMPCoBw+KgPDNEgCMIQDKFgCsYQDLGQC8kQDeEQDtEQDfAA",
  );
  const [deck1, setDeck1] = createSignal(
    "AeFB8ggQAxEB85gQCkFx9b4QDVEh9skQDWGR+coQDdLRA9wRDqLxDOARD7IBD+ERD+EB",
  );

  const [uiIo, Chessboard] = createPlayer(1);

  const [popupWindow, setPopupWindow] = createSignal<Window | null>(null);

  const showPopup = async () => {
    if (popupWindow() !== null) {
      return;
    }
    const newWindow = window.open(
      window.location.href,
      "_blank",
      "popup=yes, depended=yes, height=750, width=750",
    );
    setPopupWindow(newWindow);
    // 不知道为什么 onbeforeload 不起作用
    const autoGiveupWhenChildCloseInterval = window.setInterval(() => {
      if (newWindow?.closed && autoGiveupWhenChildCloseInterval !== null) {
        window.clearInterval(autoGiveupWhenChildCloseInterval);
        childIo.giveUp = true;
        setPopupWindow(null);
      }
    }, 1000);
    await new Promise<void>((resolve) => {
      const handler = (e: MessageEvent) => {
        const { data } = e;
        if (typeof data !== "object" || data === null) {
          return;
        }
        if (data.giTcg !== "1.0") {
          return;
        }
        if (!("method" in data)) {
          return;
        }
        if (data.method === "initialized") {
          window?.removeEventListener("message", handler);
          resolve();
        }
      };
      window?.addEventListener("message", handler);
    });
  };

  const childIo: PlayerIOWithCancellation = {
    giveUp: false,
    notify: (...params) => {
      popupWindow()?.postMessage({
        giTcg: "1.0",
        method: "notify",
        params,
      });
    },
    rpc: async (...params): Promise<any> => {
      const id = Math.random().toString(36).slice(2);
      const result = new Promise((resolve) => {
        const handler = (e: MessageEvent) => {
          const { data } = e;
          if (typeof data !== "object" || data === null) {
            return;
          }
          if (data.giTcg !== "1.0") {
            return;
          }
          if (!("method" in data)) {
            return;
          }
          if (data.method === "rpc" && data.id === id) {
            window?.removeEventListener("message", handler);
            resolve(data.result);
          }
        };
        window?.addEventListener("message", handler);
      });
      popupWindow()?.postMessage({
        giTcg: "1.0",
        method: "rpc",
        params,
        id,
      });
      return result;
    },
    cancelRpc: () => {
      popupWindow()?.postMessage({
        giTcg: "1.0",
        method: "cancelRpc",
      });
    },
  };

  const [stateLog, setStateLog] = createSignal<GameStateLogEntry[]>([]);
  // -1 代表不显示历史
  const [viewingLogIndex, setViewingLogIndex] = createSignal<number>(-1);
  const [viewingWho, setViewingWho] = createSignal<0 | 1>(1);
  const viewingState = (): GameStateLogEntry | undefined => {
    const index = viewingLogIndex();
    return stateLog()[index];
  };
  const enableLog = () => {
    setViewingWho(1);
    setViewingLogIndex(stateLog().length - 2);
  };
  const exportLog = () => {
    const logs = serializeGameStateLog(stateLog());
    const blob = new Blob([JSON.stringify(logs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gameLog.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const importLog = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) {
        alert(`Failed to read uploaded file`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const contents = event.target?.result as string;
        try {
          const logs = JSON.parse(contents);
          setStateLog(deserializeGameStateLog(data, logs));
          setViewingLogIndex(0);
          setStarted(true);
        } catch (error) {
          console.error(error);
          alert(
            `Error parsing input: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  let game: Game | null = null;
  const pause = async () => {
    if (game !== null) {
      setStateLog(game.stateLog);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const onGameError = (e: unknown, from: Game) => {
    if (from === game) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const getGameOption = () => {
    const playerConfig0 = getPlayerConfig(deck0());
    const playerConfig1 = getPlayerConfig(deck1());
    const playerConfigs = [playerConfig0, playerConfig1] as const;
    const io: GameIO = {
      pause,
      players: [childIo, uiIo],
    };
    return { data, io, playerConfigs };
  };

  const onStart = async () => {
    await showPopup();
    const initialGame = new Game(getGameOption());
    game = initialGame;
    initialGame.start().catch((e) => onGameError(e, initialGame));

    setStarted(true);
  };

  const resumeGame = async () => {
    childIo.giveUp = false;
    uiIo.giveUp = false;
    await showPopup();
    const logs = stateLog().slice(0, viewingLogIndex() + 1);
    childIo.cancelRpc();
    uiIo.cancelRpc();
    game?.terminate();
    const newGame = new Game(getGameOption());
    game = newGame;
    newGame.startWithStateLog(logs).catch((e) => onGameError(e, newGame));
    setViewingLogIndex(-1);
  };

  const childGiveUpHandler = (e: MessageEvent) => {
    const { data } = e;
    if (typeof data !== "object" || data === null) {
      return;
    }
    if (data.giTcg !== "1.0") {
      return;
    }
    if (!("method" in data)) {
      return;
    }
    if (data.method === "giveUp") {
      childIo.giveUp = true;
    }
  };

  onMount(() => {
    window.addEventListener("beforeunload", () => {
      popupWindow()?.close();
    });
    window.addEventListener("message", childGiveUpHandler);
  });
  onCleanup(() => {
    window.removeEventListener("message", childGiveUpHandler);
  });

  return (
    <div>
      <Show
        when={started()}
        fallback={
          <div class="config-panel">
            <div class="config-panel__title">牌组配置</div>
            <div class="config-panel__deck">
              <label>先手牌组</label>
              <input
                type="text"
                value={deck0()}
                onInput={(e) => setDeck0(e.currentTarget.value)}
              />
            </div>
            <div class="config-panel__deck">
              <label>后手牌组</label>
              <input
                type="text"
                value={deck1()}
                onInput={(e) => setDeck1(e.currentTarget.value)}
              />
            </div>
            <div class="config-panel__description">
              点击下方按钮开始对局；先手方棋盘会在弹出窗口显示，后手方棋盘在本页面显示。
              <br />
              （若弹窗不显示为浏览器阻止，请允许本页面使用弹出式窗口。）
            </div>
            <button onClick={onStart}>开始对局</button>
          </div>
        }
      >
        <Show
          when={viewingState()}
          fallback={
            <>
              <div class="title-row">
                <span class="title">后手方棋盘</span>
                <button disabled={stateLog().length <= 1} onClick={enableLog}>
                  查看历史
                </button>
              </div>
              <Chessboard />
            </>
          }
        >
          {(state) => (
            <>
              <div class="title-row">
                <span class="title">
                  {viewingWho() ? "后" : "先"}手方棋盘（查看历史中）
                </span>
                <Show
                  when={
                    viewingLogIndex() < stateLog().length - 1 &&
                    state().canResume
                  }
                >
                  <button onClick={resumeGame}>从此处继续</button>
                </Show>
                <button onClick={() => setViewingWho((i) => (1 - i) as 0 | 1)}>
                  切换玩家
                </button>
                <button
                  disabled={viewingLogIndex() <= 0}
                  onClick={() => setViewingLogIndex((i) => i - 1)}
                >
                  后退一步
                </button>
                <button
                  disabled={viewingLogIndex() >= stateLog().length - 1}
                  onClick={() => setViewingLogIndex((i) => i + 1)}
                >
                  前进一步
                </button>
                <button onClick={() => setViewingLogIndex(-1)}>返回游戏</button>
              </div>
              <StandaloneChessboard
                class="grayscale"
                stateData={exposeState(viewingWho(), state().state)}
                who={viewingWho()}
                events={state().events}
              />
            </>
          )}
        </Show>
      </Show>
      <details>
        <summary>开发者选项</summary>
        <button disabled={stateLog().length === 0} onClick={exportLog}>
          导出日志
        </button>
        <button disabled={started()} onClick={importLog}>
          导入日志
        </button>
      </details>
    </div>
  );
}
