import data from "@gi-tcg/data";
import { GameIO, PlayerConfig, PlayerIO, startGame } from "@gi-tcg/core";

import { createPlayer, createWaitNotify } from "@gi-tcg/webui-core";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { decode } from "./sharingCode";
import shareIdMap from "./shareId.json";
import { Child } from "./Child";

function getPlayerConfig(shareCode: string): PlayerConfig {
  const [ch0, ch1, ch2, ...cards] = decode(shareCode).map(
    (sid) => (shareIdMap as any)[sid],
  );
  return {
    characters: [ch0, ch1, ch2],
    cards,
    noShuffle: import.meta.env.DEV,
    alwaysOmni: import.meta.env.DEV,
  };
}

export function App() {
  if (window.opener !== null) {
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

  let popupWindow: Window | null = null;

  const childIo: PlayerIO = {
    giveUp: false,
    notify: (...params) => {
      popupWindow?.postMessage({
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
          console.log(data);
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
      popupWindow?.postMessage({
        giTcg: "1.0",
        method: "rpc",
        params,
        id,
      });
      return result;
    },
  };

  const onStart = () => {
    const playerConfig0 = getPlayerConfig(deck0());
    const playerConfig1 = getPlayerConfig(deck1());
    const io: GameIO = {
      pause: () => new Promise((resolve) => setTimeout(resolve, 500)),
      players: [childIo, uiIo],
    };

    popupWindow = window.open(
      window.location.href,
      "_blank",
      "popup=yes, depended=yes, height=750, width=750",
    );
    popupWindow?.addEventListener("beforeunload", () => {
      childIo.giveUp = true;
    });

    startGame({
      data,
      io,
      playerConfigs: [playerConfig0, playerConfig1],
    })
      .then((winner) => alert(`Winner is ${winner}`))
      .catch((e) => alert(e instanceof Error ? e.message : String(e)));
    setStarted(true);
  };

  onMount(() => {
    window.addEventListener("beforeunload", () => {
      popupWindow?.close();
    });
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
        <div class="title">后手方棋盘</div>
        <Chessboard />
      </Show>
    </div>
  );
}
