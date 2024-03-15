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

import { Show, createSignal, onCleanup, onMount } from "solid-js";
import data from "@gi-tcg/data";
import { GameStateLogEntry, deserializeGameStateLog } from "@gi-tcg/core";
import { StandaloneChild } from "./StandaloneChild";
import { StandaloneParent } from "./StandaloneParent";
import { reject } from "core-js/fn/promise";

export function App() {
  if (window.opener !== null) {
    // eslint-disable-next-line solid/components-return-once
    return <StandaloneChild />;
  }
  const [started, setStarted] = createSignal<boolean>(false);
  const [logs, setLogs] = createSignal<GameStateLogEntry[] | false>(false);
  const [deck0, setDeck0] = createSignal(
    "AVCg3jUPA0Bw9ZUPCVCw9qMPCoBw+KgPDNEgCMIQDKFgCsYQDLGQC8kQDeEQDtEQDfAA",
  );
  const [deck1, setDeck1] = createSignal(
    "AeFB8ggQAxEB85gQCkFx9b4QDVEh9skQDWGR+coQDdLRA9wRDqLxDOARD7IBD+ERD+EB",
  );
  const importLog = async () => {
    return new Promise<GameStateLogEntry[]>((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement)?.files?.[0];
        if (!file) {
          reject(`Failed to read uploaded file`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const contents = event.target?.result as string;
          try {
            const logs = JSON.parse(contents);
            resolve(deserializeGameStateLog(data, logs));
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      };
      input.oncancel = () => {
        reject(`File upload canceled`);
      };
      input.click();
    });
  };

  return (
    <div>
      <div>
        <Show when={!started()}>
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
            <button onClick={() => setStarted(true)}>开始对局</button>
            <button
              onClick={async () => {
                const logs = await importLog().catch(alert);
                if (logs) {
                  setLogs(logs);
                  setStarted(true);
                }
              }}
            >
              导入日志
            </button>
          </div>
        </Show>
        <Show when={started()}>
          <StandaloneParent logs={logs()} deck0={deck0()} deck1={deck1()} />
        </Show>
      </div>
    </div>
  );
}
