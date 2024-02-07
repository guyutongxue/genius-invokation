import data from "@gi-tcg/data";
import { GameIO, PlayerConfig, startGame } from "@gi-tcg/core";

import { createPlayer, createWaitNotify } from "@gi-tcg/webui-core";
import { Show, createSignal } from "solid-js";
import { decode } from "./sharingCode";
import shareIdMap from "./shareId.json";

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
  const [started, setStarted] = createSignal(false);
  const [deck0, setDeck0] = createSignal(
    "AVCg3jUPA0Bw9ZUPCVCw9qMPCoBw+KgPDNEgCMIQDKFgCsYQDLGQC8kQDeEQDtEQDfAA",
  );
  const [deck1, setDeck1] = createSignal(
    "AeFB8ggQAxEB85gQCkFx9b4QDVEh9skQDWGR+coQDdLRA9wRDqLxDOARD7IBD+ERD+EB",
  );
  
  const [io0, Chessboard0] = createPlayer(0);
  const [io1, Chessboard1] = createPlayer(1);

  const onStart = () => {
    const playerConfig0 = getPlayerConfig(deck0());
    const playerConfig1 = getPlayerConfig(deck1());
    const io: GameIO = {
      pause: () => new Promise((resolve) => setTimeout(resolve, 500)),
      players: [io0, io1],
    };
    startGame({
      data,
      io,
      playerConfigs: [playerConfig0, playerConfig1],
    })
      .then((winner) => alert(`Winner is ${winner}`))
      .catch((e) => alert(e instanceof Error ? e.message : String(e)));
    setStarted(true);
  };

  return (
    <div>
      <Show
        when={started()}
        fallback={
          <div>
            <label>Player 0</label>
            <input
              type="text"
              value={deck0()}
              onInput={(e) => setDeck0(e.currentTarget.value)}
            />
            <br />
            <label>Player 1</label>
            <input
              type="text"
              value={deck1()}
              onInput={(e) => setDeck1(e.currentTarget.value)}
            />
            <br />
            <button onClick={onStart}>Start</button>
          </div>
        }
      >
        <Chessboard0 />
        <Chessboard1 />
      </Show>
    </div>
  );
}
