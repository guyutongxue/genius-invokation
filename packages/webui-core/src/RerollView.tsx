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

import type { DiceType } from "@gi-tcg/typings";
import { Dice } from "./Dice";
import { Index } from "solid-js";
import { createStore } from "solid-js/store";

export interface RerollViewProps {
  dice: readonly DiceType[];
  onConfirm?: (indexes: number[]) => void;
}

export function RerollView(props: RerollViewProps) {
  const [chosenIndexes, setChosenIndexes] = createStore<number[]>([]);
  function reverseChosen(i: number) {
    chosenIndexes.includes(i)
                  ? setChosenIndexes(chosenIndexes.filter((x) => x !== i))
                  : setChosenIndexes([...chosenIndexes, i])
  }
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="max-w-[20em] grid grid-cols-4 gap-6">
        <Index each={props.dice}>
          {(d, i) => (
            <li>
              <div style="position: relative">
                {/* 骰子 */}
                <Dice type={d()} selected={chosenIndexes.includes(i)} size={70} />
                {/* 点选、滑动点选触发区域，css调整使其位于父对象居中 */}
                <div style="cursor: pointer; position:absolute; z-index: 1; width: 60px; height: 60px; left: 50%; top: 50%; transform: translate(-50%, -50%); background-color: aqua; opacity: 0;"
                  onmousedown={() => reverseChosen(i)}
                  onmouseenter={(event) => event.buttons === 1 ? reverseChosen(i) : null}>
                </div>
              </div>
            </li>
          )}
        </Index>
      </ul>
      <button
        class="mt-6 btn btn-green"
        onClick={() => props.onConfirm?.(chosenIndexes)}
      >
        确定
      </button>
    </div>
  );
}
