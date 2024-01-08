import { useId } from "preact/hooks";

import { Dice, DiceProps } from "./dice";

interface SelectableDiceProps extends DiceProps {
  value: number;
}

function SelectableDice({ value, ...props }: SelectableDiceProps) {
  const id = useId();
  return (
    <li>
      <input type="checkbox" hidden value={value} id={id} v-model="removed" />
      <label for={id} class="cursor-pointer">
        <Dice {...props} />
      </label>
    </li>
  );
}

export function RollDice({ dice }) {
  return (
    <div class="flex flex-col justify-center items-center">
      <ul class="max-w-[20em] grid grid-cols-4 gap-6">
        {dice.map((d, i) => (
          <SelectableDice key={i} />
        ))}
      </ul>
      <button class="mt-6 btn btn-green" onClick={selected}>
        确定
      </button>
    </div>
  );
}
