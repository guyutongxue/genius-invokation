import { JSX, Match, Switch, createSignal, onCleanup, onMount } from "solid-js";
import { PVP_ENDPOINT } from "./config";
import { PlayerIO } from "@gi-tcg/core";
import { createPlayer } from "@gi-tcg/webui-core";
import { getName } from "./names";

export interface MultiplayerGuestProps {
  deck: string;
  roomId: string;
}

export function MultiplayerGuest(props: MultiplayerGuestProps) {
  let socket: WebSocket | null = null;
  const [who, setWho] = createSignal<0 | 1>(0);
  const [started, setStarted] = createSignal<boolean>(false);

  let guestIo: PlayerIO | null = null;
  const [chessboard, setChessboard] = createSignal<JSX.Element>();

  const socketMessageHandler = async (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    switch (data.method) {
      case "reply:initialize": {
        setWho(data.who);
        const [io, Chessboard] = createPlayer(data.who, {
          onGiveUp: () => {
            socket?.send(JSON.stringify({ method: "giveUp" }));
            io.giveUp = true;
          },
          assetAltText: getName
        });
        guestIo = io;
        setChessboard(<Chessboard />);
        setStarted(true);
        break;
      }
      case "notify": {
        guestIo?.notify(data.params[0]);
        break;
      }
      case "rpc": {
        const result = await guestIo?.rpc(data.params[0], data.params[1]);
        socket?.send(JSON.stringify({ method: "reply:rpc", result, id: data.id }));
      }
    }
  };

  onMount(async () => {
    socket = new WebSocket(`${PVP_ENDPOINT}/room/${props.roomId}`);
    await new Promise((resolve, reject) => {
      socket!.onopen = resolve;
      socket!.onerror = (e) => {
        console.error(e);
        alert(`Connection closed due to error (see console for details)`);
        reject(e);
      };
    });
    socket.addEventListener("message", socketMessageHandler);
    socket.send(JSON.stringify({ method: "initialize", deck: props.deck }));
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
        </Match>
        <Match when={true}>
          <div class="title-row">
            <span class="title">正在建立连接...</span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
