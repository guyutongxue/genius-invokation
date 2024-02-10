import { createPlayer } from "@gi-tcg/webui-core";
import { onCleanup, onMount } from "solid-js";

export function Child() {
  const [uiIo, Chessboard] = createPlayer(0, {
    onGiveUp: () => {
      window.opener?.postMessage({
        giTcg: "1.0",
        method: "giveUp"
      })
    },
  });

  async function messageHandler(e: MessageEvent) {
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
    console.log(data);
    switch (data.method) {
      case "notify": {
        if (!Array.isArray(data.params)) {
          return;
        }
        uiIo.notify(...(data.params as [any]));
        break;
      }
      case "rpc": {
        if (!Array.isArray(data.params)) {
          return;
        }
        const result = await uiIo.rpc(...(data.params as [any, any]));
        console.log(result);
        (e.source as WindowProxy)?.postMessage({
          giTcg: "1.0",
          method: "rpc",
          result,
          id: data.id
        }, "*");
        break;
      }
    }
  }

  onMount(() => {
    window.addEventListener("message", messageHandler);
  });

  onCleanup(() => {
    window.removeEventListener("message", messageHandler);
  });

  return (
    <div>
      <div class="title">先手方棋盘</div>
      <Chessboard />
    </div>
  );
}
