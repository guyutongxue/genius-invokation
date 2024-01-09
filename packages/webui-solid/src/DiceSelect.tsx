import { DiceType } from "@gi-tcg/typings";
import {
  For,
  Index,
  JSX,
  Show,
  createEffect,
  createSignal,
  mergeProps,
} from "solid-js";
import { checkDice, chooseDice } from "@gi-tcg/utils";

import { Dice } from "./Dice";
import { createStore, produce } from "solid-js/store";

export interface DiceSelectProps {
  required?: readonly DiceType[];
  value: readonly DiceType[];
  disabled?: readonly DiceType[];
  confirmOnly?: boolean;
  disableConfirm?: boolean;
  onConfirm?: (dice: DiceType[]) => void;
  onCancel?: () => void;
}

export function DiceSelect(props: DiceSelectProps) {
  const merged = mergeProps(
    {
      confirmOnly: false,
      disableConfirm: false,
      required: [] as readonly DiceType[],
      disabled: [] as readonly DiceType[],
    },
    props,
  );
  const [chosen, setChosen] = createStore<boolean[]>([]);
  createEffect(() => {
    setChosen(chooseDice(merged.required, merged.value));
  });
  const chosenDice = () => props.value.filter((_, i) => chosen[i]);
  const flipChosen = (index: number) => {
    setChosen(produce((p) => void (p[index] = !p[index])));
  };
  const isValid = () => checkDice(merged.required, chosenDice());
  return (
    <div class="p-3 flex flex-col justify-between items-center">
      <ul
        class="grid grid-cols-2"
        classList={{ "opacity-60": merged.confirmOnly }}
      >
        <Index each={merged.value}>
          {(d, i) => (
            <li onClick={() => !merged.confirmOnly && flipChosen(i)}>
              <Dice type={d()} selected={chosen[i]} size={40} />
            </li>
          )}
        </Index>
      </ul>
      <div class="flex flex-col gap-1">
        <button
          class="btn btn-yellow text-black"
          disabled={merged.disableConfirm || !isValid()}
          onClick={() => merged.onConfirm && merged.onConfirm(chosenDice())}
        >
          确认
        </button>
        <Show when={!merged.confirmOnly}>
          <button
            class="btn btn-red"
            onClick={() => merged.onCancel && merged.onCancel()}
          >
            取消
          </button>
        </Show>
      </div>
    </div>
  );
}
