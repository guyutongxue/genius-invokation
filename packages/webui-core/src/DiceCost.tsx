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
import { diceToMap } from "@gi-tcg/utils";
import { ComponentProps, For, splitProps } from "solid-js";

import { Dice, DiceColor } from "./Dice";

interface DiceCostProps extends ComponentProps<"div"> {
  cost: readonly DiceType[];
  realCost?: readonly DiceType[];
}

export function DiceCost(props: DiceCostProps) {
  const [local, restProps] = splitProps(props, ["cost", "realCost"]);
  const diceMap = () => {
    const costMap = diceToMap(local.cost);
    let result: [type: DiceType, count: number, color: DiceColor][] = [];
    if (local.realCost) {
      const realCostMap = diceToMap(local.realCost);
      const allCostType = new Set([...local.cost, ...local.realCost]);
      if (allCostType.size === 0) {
        allCostType.add(8 /* Omni */);
      }
      for (const type of allCostType) {
        const realCount = realCostMap.get(type) ?? 0;
        const originalCount = costMap.get(type) ?? 0;
        const color =
        realCount > originalCount
            ? "increased"
            : realCount < originalCount
              ? "decreased"
              : "normal";
        result.push([type, realCount, color]);
      }
    } else {
      result = [...costMap.entries()].map(([type, count]) => [
        type,
        count,
        "normal",
      ]);
    }
    return result;
  };
  return (
    <div {...restProps}>
      <For each={diceMap()}>
        {([type, count, color]) => (
          <Dice type={type} text={`${count}`} size={30} color={color} />
        )}
      </For>
    </div>
  );
}
