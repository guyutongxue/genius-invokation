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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { createSignal, createResource, Show, For, createEffect } from "solid-js";
import axios from "axios";
import { ToggleSwitch } from "./ToggleSwitch";

export interface CreateRoomDialogProps {
  ref: HTMLDialogElement;
}

interface TimeConfig {
  name: string;
  initTotalActionTime: number;
  rerollTime: number;
  roundTotalActionTime: number;
  actionTime: number;
}

const TIME_CONFIGS: TimeConfig[] = [
  {
    name: "最小",
    initTotalActionTime: 0,
    rerollTime: 25,
    roundTotalActionTime: 0,
    actionTime: 25,
  },
  {
    name: "标准",
    initTotalActionTime: 45,
    rerollTime: 40,
    roundTotalActionTime: 60,
    actionTime: 25,
  },
  {
    name: "超长",
    initTotalActionTime: 0,
    rerollTime: 300,
    roundTotalActionTime: 0,
    actionTime: 300,
  },
];

export function CreateRoomDialog(props: CreateRoomDialogProps) {
  let dialogEl: HTMLDialogElement;
  const closeDialog = () => {
    dialogEl.close();
  };
  const [versionInfo] = createResource(() =>
    axios.get("version").then((res) => res.data),
  );
  const [version, setVersion] = createSignal(0);
  const [timeConfig, setTimeConfig] = createSignal(TIME_CONFIGS[1]);

  createEffect(() => {
    if (versionInfo()) {
      setVersion(versionInfo().supportedGameVersions.length - 1);
    }
  });

  createEffect(() => {
    const verIdx = version();
    console.log(verIdx);
  });

  return (
    <dialog
      ref={(el) => (dialogEl = el) && (props.ref as any)?.(el)}
      class="h-[calc(100vh-6rem)] w-[calc(100vw-6rem)] rounded-xl shadow-xl p-6 relative"
    >
      <div class="flex flex-col h-full w-full gap-5">
        <h3 class="flex-shrink-0 text-xl font-bold">房间配置</h3>
        <div class="flex-grow min-h-0 flex flex-row gap-4">
          <div class="flex-grow">
            <Show when={versionInfo()}>
              <div>
                <h4 class="text-lg">游戏版本</h4>
                <select value={version()} onChange={(e) => setVersion(Number(e.target.value))}>
                  <For each={versionInfo().supportedGameVersions}>
                    {(version, idx) => <option value={idx()}>{version}</option>}
                  </For>
                </select>
              </div>
              <h4 class="text-lg">思考时间</h4>
              <div class="flex flex-row gap-2">
                <For each={TIME_CONFIGS}>
                  {(config) => (
                    <div
                      class="b-1 b-gray-400 rounded-lg p-12px group data-[active=true]:b-slate-500 data-[active=true]:b-2 data-[active=true]:p-11px cursor-pointer data-[active=true]:cursor-default select-none transition-colors"
                      data-active={config === timeConfig()}
                      onClick={() => setTimeConfig(config)}
                    >
                      <h5 class="font-bold text-gray-400 group-data-[active=true]:text-black transition-colors mb-2">
                        {config.name}
                      </h5>
                      <ul class="pl-5 list-disc text-gray-400 text-sm group-data-[active=true]:text-slate-500 transition-colors">
                        <li>初始化总时间：{config.initTotalActionTime}s</li>
                        <li>每重投时间：{config.rerollTime}s</li>
                        <li>每回合总时间：{config.roundTotalActionTime}s</li>
                        <li>每行动时间：{config.actionTime}s</li>
                      </ul>
                    </div>
                  )}
                </For>
              </div>
              <h4 class="text-lg">公开加入</h4>
              <ToggleSwitch />
              <h4 class="text-lg">允许观战</h4>
              <ToggleSwitch checked />
            </Show>
          </div>
          <div class="b-r-gray-200 b-1" />
          <div>
            <h4 class="text-lg">选择出战卡组</h4>
          </div>
        </div>
        <div class="flex-shrink-0 flex flex-row justify-end gap-4">
          <button
            class="btn btn-ghost-red text-1em gap-0.5em"
            onClick={closeDialog}
          >
            取消
          </button>
          <button
            class="btn btn-solid-green text-1em gap-0.5em"
            onClick={closeDialog}
          >
            创建房间
          </button>
        </div>
      </div>
      <button
        class="absolute right-4 top-4 h-5 w-5 text-black bg-transparent"
        onClick={closeDialog}
      >
        <i class="inline-block h-full w-full i-mdi-window-close" />
      </button>
    </dialog>
  );
}
