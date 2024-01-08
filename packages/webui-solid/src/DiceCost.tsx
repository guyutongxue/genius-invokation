import type { DiceType } from "@gi-tcg/typings";
import { For, JSX, splitProps } from "solid-js";

import { Dice } from "./Dice";

interface DiceCostProps extends JSX.HTMLAttributes<HTMLDivElement> {
  cost: DiceType[];
  realCost?: DiceType[];
}

function diceToMap(dice: readonly DiceType[]): Map<DiceType, number> {
  const result = new Map<DiceType, number>();
  for (const d of dice) {
    result.set(d, (result.get(d) ?? 0) + 1);
  }
  return result;
}

export function DiceCost(props: DiceCostProps) {
  const [local, restProps] = splitProps(props, ["cost", "realCost"]);
  const diceMap = () => [...diceToMap(local.cost).entries()];
  return (
    <div {...restProps}>
      <For each={diceMap()}>
        {([type, count]) => <Dice type={type} text={`${count}`} size={30} />}
      </For>
    </div>
  );
}
