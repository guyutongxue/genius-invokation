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
