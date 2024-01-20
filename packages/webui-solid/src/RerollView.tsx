import { DiceType } from "@gi-tcg/typings";
import { Dice } from "./Dice";
import { Index } from "solid-js";
import { createStore } from "solid-js/store";

export interface RerollViewProps {
  dice: readonly DiceType[];
  onConfirm?: (indexes: number[]) => void;
}

export function RerollView(props: RerollViewProps) {
  const [chosenIndexes, setChosenIndexes] = createStore<number[]>([]);
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="max-w-[20em] grid grid-cols-4 gap-6">
        <Index each={props.dice}>
          {(d, i) => (
            <li
              class="cursor-pointer"
              onClick={() =>
                chosenIndexes.includes(i)
                  ? setChosenIndexes(chosenIndexes.filter((x) => x !== i))
                  : setChosenIndexes([...chosenIndexes, i])
              }
            >
              <Dice type={d()} selected={chosenIndexes.includes(i)} size={70} />
            </li>
          )}
        </Index>
      </ul>
      <button
        class="mt-6 btn btn-green"
        onClick={() => props.onConfirm && props.onConfirm(chosenIndexes)}
      >
        确定
      </button>
    </div>
  );
}
