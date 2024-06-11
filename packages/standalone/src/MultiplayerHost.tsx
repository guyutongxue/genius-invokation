import {
  onMount,
  onCleanup,
  createSignal,
  JSX,
  Show,
  Switch,
  Match,
} from "solid-js";
import { PVP_ENDPOINT } from "./config";
import {
  Game,
  GameState,
  GameStateLogEntry,
  PlayerIO,
  serializeGameStateLog,
} from "@gi-tcg/core";
import tcgData from "@gi-tcg/data";
import { createPlayer } from "@gi-tcg/webui-core";
import { decode as decodeShareCode } from "@gi-tcg/utils";
import { getName } from "./names";

export interface MultiplayerHostProps {
  deck: string;
}

export function MultiplayerHost(props: MultiplayerHostProps) {
  let socket: WebSocket | null = null;
  const [roomId, setRoomId] = createSignal<string>("");
  const [who, setWho] = createSignal<0 | 1>(0);
  const [started, setStarted] = createSignal<boolean>(false);

  const [stateLog, setStateLog] = createSignal<GameStateLogEntry[]>([]);
  let guestIo: PlayerIO | null = null;
  const [chessboard, setChessboard] = createSignal<JSX.Element>();
  let game: Game | null = null;
  const pause = async (state: GameState, mutations: unknown, canResume: boolean) => {
    if (game !== null) {
      setStateLog((logs) => [...logs, { state, canResume }]);
    }
  };

  const onGameError = (e: unknown) => {
    console.error(e);
    alert(e instanceof Error ? e.message : String(e));
  };

  const socketMessageHandler = (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    switch (data.method) {
      case "roomId": {
        setRoomId(String(data.roomId));
        break;
      }
      case "reply:initialize": {
        setWho(data.who);
        const hostConfig = decodeShareCode(props.deck);
        const guestConfig = decodeShareCode(data.guestDeck);
        const [hostIo, Chessboard] = createPlayer(data.who, {
          assetAltText: getName,
        });
        guestIo = {
          notify: (...params) => {
            socket?.send(JSON.stringify({ method: "notify", params }));
          },
          rpc: async (...params): Promise<any> => {
            const id = Math.random().toString(36).slice(2);
            const result = new Promise((resolve) => {
              const handler = (e: MessageEvent) => {
                const data = JSON.parse(e.data);
                if (data.method === "reply:rpc" && data.id === id) {
                  socket?.removeEventListener("message", handler);
                  resolve(data.result);
                }
              };
              socket?.addEventListener("message", handler);
            });
            socket?.send(JSON.stringify({ method: "rpc", id, params }));
            return result;
          },
          giveUp: false,
        };
        let playerConfigs;
        let playerIos;
        if (who() === 0) {
          playerConfigs = [hostConfig, guestConfig] as const;
          playerIos = [hostIo, guestIo] as const;
        } else {
          playerConfigs = [guestConfig, hostConfig] as const;
          playerIos = [guestIo, hostIo] as const;
        }
        setChessboard(<Chessboard />);
        game = new Game({
          data: tcgData,
          io: {
            pause,
            players: playerIos,
          },
          playerConfigs,
        });
        game.start().catch(onGameError);
        setStarted(true);
        break;
      }
      case "giveUp": {
        guestIo && (guestIo.giveUp = true);
        // socket?.close();
        break;
      }
    }
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

  onMount(async () => {
    socket = new WebSocket(`${PVP_ENDPOINT}/request-room`);
    await new Promise((resolve, reject) => {
      socket!.onopen = resolve;
      socket!.onerror = (e) => {
        console.error(e);
        alert(`Connection closed due to error (see console for details)`);
        reject(e);
      };
    });
    socket.addEventListener("message", socketMessageHandler);
    socket.send(JSON.stringify({ method: "initialize" }));
  });
  onCleanup(() => {
    socket?.close();
  });
  return (
    <div>
      <Switch>
        <Match when={started()}>
          <div class="title-row">
            <span class="title">您是 {who() ? "后手" : "先手"}</span>
          </div>
          {chessboard()}
          <button disabled={stateLog().length === 0} onClick={exportLog}>
            导出日志
          </button>
        </Match>
        <Match when={roomId() === ""}>
          <div class="title-row">
            <span class="title">正在分配房间...</span>
          </div>
        </Match>
        <Match when={true}>
          <div class="title-row">
            <span class="title">
              房间号：<strong>{roomId().padStart(6, '0')}</strong>，正在等待对方加入...
            </span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
