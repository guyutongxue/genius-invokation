import type { DiceType } from "@gi-tcg/typings";
import { diceToMap } from "@gi-tcg/utils";
import { For, JSX, splitProps } from "solid-js";

import { Dice } from "./Dice";

interface DiceCostProps extends JSX.HTMLAttributes<HTMLDivElement> {
  cost: readonly DiceType[];
  realCost?: readonly DiceType[];
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
